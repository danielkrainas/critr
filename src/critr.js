"use strict";

(function () {

    var noopHandler = function () {
        return true;
    };

    var defaults = {
        stages: {
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
                    var values = this.evaluateFieldExpression(item, context.param);
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
                return context.value.reduce(function (p, expression) {
                    return p && context._.test(context.data, expression);
                }, true);
            },

            $or: function (context) {
                return context.value.reduce(function (p, expression) {
                    return p || context._.test(context.data, expression);
                }, false);
            },

            $nor: function (context) {
                return context.value.reduce(function (p, expression) {
                    return p && !context._.test(context.data, expression);
                }, true);
            },

            $not: function (context) {
                return !context._.test(context.data, context.value);
            },

            $eq: function (context) {
                return deepCompare(context.data, context.value);
            },

            $ne: function (context) {
                return !deepCompare(context.data, context.value);
            },

            $lt: function (context) {
                return context.data < context.value;
            },

            $lte: function (context) {
                return context.data <= context.value;
            },

            $gt: function (context) {
                return context.data > context.value;
            },

            $gte: function (context) {
                return context.data >= context.value;
            },

            $in: function (context) {
                var a = asArray(context.data);
                return asArray(context.value).some(function (e) {
                    return a.indexOf(e) >= 0;
                });
            },

            $nin: function (context) {
                var a = asArray(context.data);
                return asArray(context.value).every(function (e) {
                    return a.indexOf(e) < 0;
                });
            },

            $exists: function (context) {
                return !(context.value ^ (context.data !== null));
            },

            $type: function (context) {
                return typeof context.data === context.value;
            },

            $mod: function (context) {
                return (context.data % context.value[0]) === context.value[1];
            },

            $regex: function (context) {
                var r = context.value;
                if (!(r instanceof RegExp)) {
                    r = new RegExp(r, context.expression.$options);
                }

                return context.data.match(r) !== null;
            },

            $options: noopHandler,

            $where: function (context) {
                return context.value.call(null, context.data);
            },

            $all: function (context) {
                var a = asArray(context.data);
                return context.value.every(function (e) {
                    return a.indexOf(e) >= 0;
                });
            },

            $elemMatch: function (context) {
                return Array.isArray(context.data) && context.data.some(function (e) {
                    return context._.test(e, context.value);
                });
            },

            $size: function (context) {
                return context.value === (Array.isArray(context.data) ? context.data.length : 0);
            },

            $literal: function (context) {
                return context.value;
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
            this.operator = critr.stages[operatorName];
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

            if (options.defaults) {
                this.operators = Object.create(defaults.operators);
            }

            if (options.defaultStages) {
                this.stages = Object.create(defaults.stages);
            }
        };

        Critr.prototype.Critr = Critr;

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
                var value = criteria[key];
                if (key[0] !== '$') {
                    if (typeof value !== 'object') {
                        result = deepCompare(resolve(data, key), value);
                    } else {
                        result = this.test(resolve(data, key), value);
                    }
                } else {
                    result = !!this.evaluate(data, criteria);
                }

                if (!result) {
                    break;
                }
            }

            return result;
        };

        Critr.prototype.evaluateFieldExpression = function (obj, expression) {
            return resolve(obj, expression.slice(1));
        };

        Critr.prototype.evaluate = function (obj, expression) {
            var result = null;
            if (typeof expression === 'string' && expression[0] === '$') {
                result = this.evaluateFieldExpression(obj, expression);
            } else {
                for (var key in expression) {
                    var value = expression[key];
                    var operator = this.operator(key);
                    if (operator) {
                        result = operator.call(this, {
                            value: value,
                            data: obj,
                            expression: expression,
                            _: this
                        });
                    } else {
                        throw new Error(key + ' operator is not supported.');
                    }
                }
            }

            return result;
        };

        Critr.prototype.aggregate = function (data, stages, callback) {
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

        return Critr;
    })();

    var instance = new Critr({
        defaults: true,
        defaultStages: true
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    } else {
        this.Critr = instance;
    }
}).call(this);