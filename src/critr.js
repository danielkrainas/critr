"use strict";
/*jslint bitwise: true*/

var noopHandler = function () {
    /* istanbul ignore next  */
    return true;
};

var bind = function (fn, thisArg) {
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        return fn.apply(thisArg, args);
    };
};

var map = function (arr, fn, thisArg) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        result.push(fn.call(thisArg, arr[i], i));
    }

    return result;
};

var getProperties = function (obj) {
    if (typeof obj !== 'object' || !obj) {
        return [];
    }

    return map(Object.keys(obj), function (key) {
        return {
            key: key,
            value: obj[key]
        };
    });
};

var deepClone = function (obj) {
    /* istanbul ignore if  */
    if (obj === null) {
        return null;
    }

    var clone = {};
    getProperties(obj).forEach(function (p) {
        if (p.value && typeof p.value === 'object') {
            p.value = deepClone(p.value);
        }

        clone[p.key] = p.value;
    });

    return clone;
};

var resolve = function (obj, path) {
    var paths = path.split('.');
    for (var i = 0; i < paths.length; i++) {
        if (typeof obj[paths[i]] === 'undefined') {
            return null;
        }

        obj = obj[paths[i]];
    }

    return obj;
};

var keySorter = function (a, b) {
    return a.key > b.key;
};

var deepCompare = function (a, b) {
    if (a === null || typeof a !== 'object') {
        return a === b;
    }

    var aprops = getProperties(a);
    var bprops = getProperties(b);
    if (aprops.length !== bprops.length) {
        return false;
    }

    aprops.sort(keySorter);
    bprops.sort(keySorter);
    for (var i = 0; i < aprops.length; i++) {
        if (aprops[i].key !== bprops[i].key || !deepCompare(aprops[i].value, bprops[i].value)) {
            return false;
        }
    }

    return true;
};

var asArray = function (obj) {
    return Array.isArray(obj) ? obj : [obj];
};

var defer = function (fn, args) {
    return setTimeout(function () {
        fn.apply(null, args || []);
    }, 0);
};

var makeOperatorStorageFn = function (containerName) {
    return function (key, handler, overwrite) {
        var container = this[containerName];
        if (arguments.length === 1) {
            return container[key];
        }

        if (key in container) {
            if (overwrite) {
                container[key] = handler;
            } else {
                return false;
            }
        } else {
            container[key] = handler;
        }

        return true;
    };
};

var defaults = {
    accumulators: {
        $sum: function (data, expression) {
            return data.reduce(bind(function (total, item) {
                if (typeof expression === 'number') {
                    return total + expression;
                }

                return total + this.evaluate(item, expression);
            }, this), 0);
        },

        $avg: function (data, expression) {
            var total = defaults.accumulators.$sum(data, expression);
            return total / data.length;
        },

        $first: function (data, expression) {
            return this.evaluate(data[0], expression);
        },

        $last: function (data, expression) {
            return this.evaluate(data[data.length - 1], expression);
        },

        $max: function (data, expression) {
            return data.reduce(bind(function (max, item) {
                var value = this.evaluate(item, expression);
                return max === null ? value : Math.max(max, value);
            }, this), null);
        },

        $min: function (data, expression) {
            return data.reduce(bind(function (min, item) {
                var value = this.evaluate(item, expression);
                return min === null ? value : Math.min(min, value);
            }, this), null);
        },

        $push: function (data, expression) {
            return data.map(bind(function (item) {
                return this.evaluate(item, expression);
            }, this));
        },

        $addToSet: function (data, expression) {
            var set = [];
            data.forEach(bind(function (item) {
                var value = this.evaluate(item, expression);
                if (set.indexOf(value) < 0) {
                    set.push(value);
                }
            }, this));

            return set;
        }
    },

    stages: {
        $group: function (context, next) {
            context.outputAll(this.group(context.data, context.param));
            next();
        },

        $sort: function (context, next) {
            var sorted = context.data.sort(function (a, b) {
                for (var i = 0; i < context.paramKeys.length; i++) {
                    var key = context.paramKeys[i];
                    var av = a[key];
                    var bv = b[key];

                    var result = 0;
                    if (av < bv) {
                        result = -1;
                    } else if (av > bv) {
                        result = 1;
                    }

                    result *= context.param[key];
                    if (result !== 0) {
                        return result;
                    }
                }

                return 0;
            });

            context.outputAll(sorted);
            next();
        },

        $output: function (context, next) {
            if (context.param && context.param.push) {
                context.forEachItem(function (item) {
                    context.param.push(item);
                    context.output(item);
                });
            }

            next();
        },

        $limit: function (context, next) {
            context.forEachItem(function (item, index) {
                if (index < context.param) {
                    context.output(item);
                }
            });

            next();
        },

        $skip: function (context, next) {
            context.forEachItem(function (item, index) {
                if (index >= context.param) {
                    context.output(item);
                }
            });

            next();
        },

        $match: function (context, next) {
            context.forEachItem(function (item) {
                if (this.test(item, context.param)) {
                    context.output(item);
                }
            });

            next();
        },

        $project: function (context, next) {
            context.forEachItem(function (item) {
                var result = {};
                context.forEachParamKey(function (key, paramValue) {
                    var include = false;
                    var value = item[key];
                    if (paramValue === true || paramValue === 1) {
                        include = true;
                    } else if (paramValue === false || paramValue === 0) {
                        include = false;
                    } else {
                        value = this.evaluate(item, paramValue);
                        include = true;
                    }

                    if (include) {
                        result[key] = value;
                    }
                });

                context.output(result);
            });

            next();
        },

        $unwind: function (context, next) {
            context.forEachItem(function (item) {
                var key = context.param.slice(1);
                var values = this.evaluate(item, context.param);
                if (values !== null && Array.isArray(values)) {
                    for (var k = 0; k < values.length; k++) {
                        var clone = deepClone(item);
                        clone[key] = values[k];
                        context.output(clone);
                    }
                }
            });

            next();
        }
    },

    operators: {
        $and: function (context) {
            return context.param.reduce(bind(function (last, expression) {
                return last && this.test(context.data, expression);
            }, this), true);
        },

        $or: function (context) {
            return context.param.reduce(bind(function (last, expression) {
                return last || this.test(context.data, expression);
            }, this), false);
        },

        $nor: function (context) {
            return context.param.reduce(bind(function (last, expression) {
                return last && !this.test(context.data, expression);
            }, this), true);
        },

        $not: function (context) {
            return !this.test(context.data, context.param);
        },

        $eq: function (context) {
            return deepCompare(context.data, context.param);
        },

        $ne: function (context) {
            return !deepCompare(context.data, context.param);
        },

        $lt: function (context) {
            return context.data < context.param;
        },

        $lte: function (context) {
            return context.data <= context.param;
        },

        $gt: function (context) {
            return context.data > context.param;
        },

        $gte: function (context) {
            return context.data >= context.param;
        },

        $in: function (context) {
            var a = asArray(context.data);
            return asArray(context.param).some(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        $nin: function (context) {
            var a = asArray(context.data);
            return asArray(context.param).every(function (e) {
                return a.indexOf(e) < 0;
            });
        },

        $exists: function (context) {
            return !(context.param ^ (context.data !== null));
        },

        $type: function (context) {
            return typeof context.data === context.param;
        },

        $regex: function (context) {
            var r = context.param;
            if (!(r instanceof RegExp)) {
                r = new RegExp(r, context.expression.$options);
            }

            return context.data ? context.data.match(r) !== null : false;
        },

        $options: noopHandler,

        $where: function (context) {
            return context.param.call(null, context.data);
        },

        $all: function (context) {
            var a = asArray(context.data);
            return context.param.every(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        $elemMatch: function (context) {
            return Array.isArray(context.data) && context.data.some(function (e) {
                return this.test(e, context.param);
            }, this);
        },

        $size: function (context) {
            return context.param === (Array.isArray(context.data) ? context.data.length : 0);
        },

        $literal: function (context) {
            return context.param;
        },

        $toLower: function (context) {
            return (this.evaluate(context.data, context.param) || '').toLowerCase();
        },

        $toUpper: function (context) {
            return (this.evaluate(context.data, context.param) || '').toUpperCase();
        },

        $ifNull: function (context) {
            var result = this.evaluate(context.data, context.param[0]);
            return result !== null ? result : this.evaluate(context.data, context.param[1]);
        },

        $cond: function (context) {
            var result = this.evaluate(context.data, context.param.if);
            if (result) {
                return this.evaluate(context.data, context.param.then);
            } else {
                return this.evaluate(context.data, context.param.else);
            }
        },

        $add: function (context) {
            return context.param.reduce(bind(function (sum, expression) {
                return sum + this.evaluate(context.data, expression);
            }, this), 0);
        },

        $subtract: function (context) {
            return context.param.reduce(bind(function (diff, expression) {
                var value = this.evaluate(context.data, expression);
                return diff === null ? value : diff - value;
            }, this), null);
        },

        $multiply: function (context) {
            return context.param.reduce(bind(function (product, expression) {
                return product * this.evaluate(context.data, expression);
            }, this), 1);
        },

        $divide: function (context) {
            return context.param.reduce(bind(function (quotient, expression) {
                return quotient / this.evaluate(context.data, expression);
            }, this), 1);
        },

        $mod: function (context) {
            return this.evaluate(context.data, context.param[0]) % this.evaluate(context.data, context.param[1]);
        }
    }
};

var Grouper = function (_idExpression) {
    this._idExpression = _idExpression;
    this.lookup = {};
    this.ids = [];
};

Grouper.prototype.makeFilter = function () {
    var grouper = this;
    return function (item) {
        var _id = this.evaluate(item, grouper._idExpression);
        if (grouper.ids.indexOf(_id) < 0) {
            grouper.ids.push(_id);
            grouper.lookup[_id] = [item];
        } else {
            grouper.lookup[_id].push(item);
        }
    };
};

Grouper.prototype.groups = function (fn, thisArg) {
    for (var i = 0; i < this.ids.length; i++) {
        fn.call(thisArg, this.ids[i], this.lookup[this.ids[i]]);
    }
};

Grouper.prototype.map = function (fn, thisArg) {
    var results = [];
    for (var i = 0; i < this.ids.length; i++) {
        results.push(fn.call(thisArg, this.ids[i], this.lookup[this.ids[i]]));
    }

    return results;
};

var StageContext = function (stage, data, critr) {
    var operatorName = Object.keys(stage)[0];

    this.results = [];
    this.data = data;
    this.count = data.length;
    this.stage = stage;
    this.operator = critr.stage(operatorName);
    this.name = operatorName;
    this.param = stage[operatorName];
    this.critr = critr;
    this.paramKeys = typeof this.param === 'object' ? Object.keys(this.param) : [];
};

StageContext.prototype.forEachItem = function (fn) {
    var critr = this.critr;
    this.data.forEach(function (item, index) {
        fn.call(critr, item, index);
    });
};

StageContext.prototype.outputAll = function (result) {
    result = result || [];
    this.results = this.results.concat(result);
};

StageContext.prototype.output = function (result) {
    if (result !== null) {
        this.results.push(result);
    }            
};

StageContext.prototype.callOperator = function (callback) {
    var context = this;
    this.operator.call(this.critr, this, function () {
        callback(context.results);
    });
};

StageContext.prototype.forEachParamKey = function (fn) {
    var critr = this.critr;
    var param = this.param;
    this.paramKeys.forEach(function (key) {
        fn.call(critr, key, param[key]);
    });
};

var StageContextFactory = function (critr) {
    this.critr = critr;
};

StageContextFactory.prototype.create = function (options) {           
    return new StageContext(options.stage, options.data, this.critr);
};

var Critr = function (options) {
    options = options || {};
    this.stages = {};
    this.operators = {};
    this.accumulators = {};

    if (options.defaults) {
        this.operators = Object.create(defaults.operators);
    }

    if (options.defaultStages) {
        this.stages = Object.create(defaults.stages);
    }

    if (options.defaultAccumulators) {
        this.accumulators = Object.create(defaults.accumulators);
    }
};

Critr.prototype.Critr = Critr;

Critr.prototype.stage = makeOperatorStorageFn('stages');
Critr.prototype.accumulator = makeOperatorStorageFn('accumulators');
Critr.prototype.operator = makeOperatorStorageFn('operators');

Critr.prototype.test = function (data, criteria) {
    var result = false;
    var properties = getProperties(criteria);
    while(properties.length > 0) {
        var p = properties.shift();
        var target = data ? resolve(data, p.key) : null;
        if (p.key[0] !== '$') {
            if (typeof p.value !== 'object') {
                result = p.value === target;
            } else if (p.value) {
                result = this.test(target, p.value);
            }
        } else {
            var operator = this.operator(p.key);
            if (operator) {
                result = !!operator.call(this, {
                    param: p.value,
                    data: data,
                    expression: criteria
                });
            } else {
                throw new Error(p.key + ' operator is not supported.');
            }
        }

        if (!result) {
            break;
        }
    }

    return result;
};

Critr.prototype.evaluate = function (obj, expression) {
    var result = null;
    if (typeof expression === 'string' && expression[0] === '$') {
        result = resolve(obj, expression.slice(1));
    } else if (typeof expression === 'number') {
        result = expression;
    } else {
        for (var key in expression) {
            if (!expression.hasOwnProperty(key)) {
                continue;
            }

            var param = expression[key];
            var operator = this.operator(key);
            if (operator) {
                result = operator.call(this, {
                    param: param,
                    data: obj,
                    expression: expression
                });
            } else {
                throw new Error(key + ' operator is not supported.');
            }
        }
    }

    return result;
};

Critr.prototype.pipe = function (data, stages, callback) {
    data = (data || []).slice(0);
    var stageIndex = -1;
    var contextFactory = new StageContextFactory(this);

    var nextStage = function () {
        if (++stageIndex >= stages.length) {
            return callback(data);
        }

        var stage = stages[stageIndex];
        var context = contextFactory.create({
            stage: stage,
            data: data
        });

        if (!context.operator) {
            throw new Error(context.name + ' is not a known stage operator.');
        }

        context.callOperator(function (results) {
            data = results;
            defer(nextStage);
        });
    };

    defer(nextStage);
};

Critr.prototype.group = function (data, expression) {
    var grouper = new Grouper(expression._id || '');
    data.forEach(grouper.makeFilter(), this);
    var accumulators = map(getProperties(expression).filter(function (p) {
        return !grouper._idExpression || p.key !== grouper._idExpression;
    }), function (expressionProperty) {
        var key = Object.keys(expressionProperty.value)[0];
        return {
            accumulatorKey: key,
            accumulator: this.accumulator(key),
            accumulatorExpression: expressionProperty.value[key],
            expressionProperty: expressionProperty
        };
    }, this);

    return grouper.map(function (groupKey, group) {
        var result = {};
        if (grouper._idExpression !== null) {
            result._id = groupKey;
        }

        accumulators.forEach(function (a) {
            if (a.accumulator) {
                result[a.expressionProperty.key] = a.accumulator.call(this, group, a.accumulatorExpression);
            } else {
                throw new Error(a.accumulatorKey + ' accumulator is not supported.');
            }
        });

        return result;
    }, this);
};

Critr.prototype.count = function (data, query) {
    data = asArray(data);
    return data.reduce(bind(function (last, item) {
        return this.test(item, query) ? last + 1 : last;
    }, this), 0);
};

module.exports = new Critr({
    defaults: true,
    defaultStages: true,
    defaultAccumulators: true
});
