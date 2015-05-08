"use strict";

(function () {

    var noopHandler = function () {
        return true;
    };

    var bind = function (fn, thisArg) {
        return function () {
            var args = Array.prototype.slice.call(arguments, 0);
            return fn.apply(thisArg, args);
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
                    for (var key in context.param) {
                        var av = a[key];
                        var bv = b[key];

                        var r = 0;
                        if (av < bv) {
                            r = -1;
                        } else if (av > bv) {
                            r = 1;
                        }

                        r *= context.param[key];
                        if (r !== 0) {
                            return r;
                        }
                    }

                    return 0;
                });

                context.outputAll(sorted);
                next();
            },

            $output: function (context, next) {
                if (context.param && context.param.push) {
                    context.forEachItem(function (item, index) {
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
                context.forEachItem(function (item, index) {
                    if (this.test(item, context.param)) {
                        context.output(item);
                    }
                });

                next();
            },

            $project: function (context, next) {
                context.forEachItem(function (item, index) {
                    var result = {};
                    for (var key in context.param) {
                        var paramValue = context.param[key];
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
                    }

                    context.output(result);
                });

                next();
            },

            $unwind: function (context, next) {
                context.forEachItem(function (item, index) {
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
                return context.param.toLowerCase();
            },

            $toUpper: function (context) {
                return context.param.toUpperCase();
            },

            $ifNull: function (context) {
                var result = this.evaluate(context.data, context.param[0]);
                if (result !== null) {
                    return result;
                }

                return this.evaluate(context.data, context.param[1]);
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
                    return diff - this.evaluate(context.data, expression);
                }, this), 0);
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

    var deepClone = function (obj) {
        var clone = {};
        if (obj === null) {
            return null;
        }

        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }

            var value = obj[key];
            if (value && typeof(value) === 'object') {
                value = deepClone(value);
            }

            clone[key] = value;
        }

        return clone;
    };

    var resolve = function (obj, path) {
        var paths = path.split('.');
        for (var i = 0; i < paths.length; i++) {
            if (typeof obj[paths[i]] === 'undefined') {
                return null;
            } else {
                obj = obj[paths[i]];
            }
        }

        return obj;
    };

    var getProperties = function (obj) {
        var results = [];
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) {
                continue;
            }

            results.push({
                key: k,
                value: obj[k]
            });
        }

        return results;
    };

    var deepCompare = function (a, b) {
        if ((a !== null) && (b !== null) && (typeof a === 'object') && (typeof b === 'object')) {
            var aprops = getProperties(a);
            var bprops = getProperties(b);

            if (aprops.length === bprops.length) {
                var sorter = function (x, y) {
                    return x.key > y.key;
                };

                aprops.sort(sorter);
                bprops.sort(sorter);
                var i;
                for (i = 0; i < aprops.length; i++) {
                    var aprop = aprops[i];
                    var bprop = bprop[i];
                    if (!deepCompare(aprop.key, bprop.key) || !deepCompare(aprop.value, bprop.value)) {
                        return false;
                    }
                }

                return true;
            } else {
                return false;
            }
        } else {
            return a === b;
        }
    };

    var asArray = function (obj) {
        return Array.isArray(obj) ? obj : [obj];
    };

    var defer = function (fn, args) {
        args = args || [];
        return setTimeout(function () {
            fn.apply(null, args);
        }, 0);
    };

    var StageContextFactory = (function () {
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

        var StageContextFactory = function (critr) {
            this.critr = critr;
        };

        StageContextFactory.prototype.create = function (options) {           
            return new StageContext(options.stage, options.data, this.critr);
        };

        return StageContextFactory;
    })();

    var Critr = (function () {
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

        Critr.prototype.stage = function (key, handler, overwrite) {
            if (arguments.length === 1) {
                return this.stages[key];
            }

            if (key in this.stages) {
                if (overwrite) {
                    this.stages[key] = handler;
                } else {
                    return false;
                }
            } else {
                this.stages[key] = handler;
            }

            return true;
        };

        Critr.prototype.accumulator = function (key, handler, overwrite) {
            if (arguments.length === 1) {
                return this.accumulators[key];
            }

            if (key in this.accumulators) {
                if (overwrite) {
                    this.accumulators[key] = handler;
                } else {
                    return false;
                }
            } else {
                this.accumulators[key] = handler;
            }

            return true;
        };

        Critr.prototype.operator = function (key, handler, overwrite) {
            if (arguments.length === 1) {
                return this.operators[key];
            }

            if (key in this.operators) {
                if (overwrite) {
                    this.operators[key] = handler;
                } else {
                    return false;
                }
            } else {
                this.operators[key] = handler;
            }

            return true;
        };

        Critr.prototype.test = function (data, criteria) {
            var result = false;
            for (var key in criteria) {
                var param = criteria[key];
                var target = data ? resolve(data, key) : null;
                if (key[0] !== '$') {
                    if (typeof param !== 'object') {
                        result = param === target;
                    } else if (param) {
                        result = this.test(target, param);
                    }
                } else {
                    var operator = this.operator(key);
                    if (operator) {
                        result = !!operator.call(this, {
                            param: param,
                            data: data,
                            expression: criteria
                        });
                    } else {
                        throw new Error(key + ' operator is not supported.');
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
                    // throw an error or something. `operatorName` is not a known filter
                    return defer(nextStage);
                }

                context.callOperator(function (results) {
                    data = results;
                    defer(nextStage);
                });
            };

            defer(nextStage);
        };

        Critr.prototype.group = function (data, expression) {
            var _idExpression = expression._id || null;
            var grouped = {};
            var results = [];
            data.forEach(function (item) {
                var _id = !_idExpression ? '' : this.evaluate(item, _idExpression);
                var group = grouped[_id] || [];
                group.push(item);
                grouped[_id] = group;
            }, this);

            for (var groupKey in grouped) {
                var group = grouped[groupKey];
                var result = {};
                if (_idExpression !== null) {
                    result._id = groupKey;
                }

                for (var key in expression) {
                    if (key === _idExpression) {
                        continue;
                    }

                    var param = expression[key];
                    var accumulatorKey = Object.keys(param)[0];
                    var accumulator = this.accumulator(accumulatorKey);
                    var accumulatorExpression = param[accumulatorKey];
                    if (accumulator) {
                        result[key] = accumulator.call(this, group, accumulatorExpression);
                    } else {
                        throw new Error(accumulatorKey + ' accumulator is not supported.');
                    }
                }

                results.push(result);
            }

            return results;
        };

        Critr.prototype.count = function (data, query) {
            data = asArray(data);
            return data.reduce(bind(function (last, item) {
                return this.test(item, query) ? last + 1 : last;
            }, this), 0);
        };

        return Critr;
    })();

    var instance = new Critr({
        defaults: true,
        defaultStages: true,
        defaultAccumulators: true
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    } else {
        this.Critr = instance;
    }

}).call(this); // jshint ignore:line
