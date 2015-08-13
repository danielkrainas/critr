/*! critr v1.0.0 (https://github.com/danielkrainas/critr) */
(function() {
    var $$modules = {}, defineModule = function(name, exporter) {
        $$modules[name] = {
            exporter: exporter,
            ready: !1
        };
    }, require = function(name) {
        var m = $$modules[name];
        return m && !m.ready && (m.exports = {}, m.exporter.call(null, require, m, m.exports), 
        m.ready = !0), m && m.exports;
    };
    defineModule("./utils", function(require, module, exports) {
        "use strict";
        var keySorter = function(a, b) {
            return a.key > b.key;
        };
        exports.isEmptyObject = function(obj) {
            return "{}" === JSON.stringify(obj);
        }, exports.bind = function(fn, thisArg) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                return fn.apply(thisArg, args);
            };
        };
        var map = exports.map = function(arr, fn, thisArg) {
            for (var result = [], i = 0; i < arr.length; i++) result.push(fn.call(thisArg, arr[i], i));
            return result;
        }, getProperties = exports.getProperties = function(obj) {
            return "object" == typeof obj && obj ? map(Object.keys(obj), function(key) {
                return {
                    key: key,
                    value: obj[key]
                };
            }) : [];
        }, deepClone = exports.deepClone = function(obj) {
            if (null === obj) return null;
            var clone = {};
            return getProperties(obj).forEach(function(p) {
                p.value && "object" == typeof p.value && (p.value = deepClone(p.value)), clone[p.key] = p.value;
            }), clone;
        };
        exports.resolve = function(obj, path) {
            for (var paths = path.split("."), i = 0; i < paths.length; i++) {
                if ("undefined" == typeof obj[paths[i]]) return null;
                obj = obj[paths[i]];
            }
            return obj;
        };
        var deepCompare = exports.deepCompare = function(a, b) {
            if (null === a || "object" != typeof a) return a === b;
            var aprops = getProperties(a), bprops = getProperties(b);
            if (aprops.length !== bprops.length) return !1;
            aprops.sort(keySorter), bprops.sort(keySorter);
            for (var i = 0; i < aprops.length; i++) if (aprops[i].key !== bprops[i].key || !deepCompare(aprops[i].value, bprops[i].value)) return !1;
            return !0;
        };
        exports.asArray = function(obj) {
            return Array.isArray(obj) ? obj : [ obj ];
        }, exports.defer = function(fn, args) {
            return setTimeout(function() {
                fn.apply(null, args || []);
            }, 0);
        };
    }), defineModule("./accumulators", function(require, module, exports) {
        "use strict";
        var utils = require("./utils"), reduce = function(data, startValue, fn) {
            return data.reduce(utils.bind(fn, this), startValue);
        }, reduceDataOperation = function(startValue, fn) {
            return 1 === arguments.length && (fn = startValue, startValue = null), function(data, expression) {
                return reduce.call(this, data, startValue, function(last, item) {
                    return fn.call(this, expression, item, this.evaluate(item, expression), last);
                });
            };
        }, $sum = exports.$sum = reduceDataOperation(0, function(expression, item, value, total) {
            return "number" == typeof expression ? total + expression : total + value;
        });
        exports.$avg = function(data, expression) {
            var total = $sum.call(this, data, expression);
            return total / data.length;
        }, exports.$first = function(data, expression) {
            return this.evaluate(data[0], expression);
        }, exports.$last = function(data, expression) {
            return this.evaluate(data[data.length - 1], expression);
        }, exports.$max = reduceDataOperation(function(expression, item, value, max) {
            return null === max ? value : Math.max(max, value);
        }), exports.$min = reduceDataOperation(function(expression, item, value, min) {
            return null === min ? value : Math.min(min, value);
        }), exports.$push = function(data, expression) {
            return data.map(utils.bind(function(item) {
                return this.evaluate(item, expression);
            }, this));
        }, exports.$addToSet = function(data, expression) {
            var set = [];
            return data.forEach(utils.bind(function(item) {
                var value = this.evaluate(item, expression);
                set.indexOf(value) < 0 && set.push(value);
            }, this)), set;
        };
    }), defineModule("./operators", function(require, module, exports) {
        "use strict";
        var utils = require("./utils"), noopHandler = function() {
            return !0;
        }, reduceParamOperation = function(startValue, fn) {
            return 1 === arguments.length && (fn = startValue, startValue = null), function(context) {
                return context.param.reduce(utils.bind(function(last, expression) {
                    return fn.call(this, context, expression, last);
                }, this), startValue);
            };
        };
        exports.$and = reduceParamOperation(!0, function(context, expression, last) {
            return last && this.test(context.data, expression);
        }), exports.$or = reduceParamOperation(!1, function(context, expression, last) {
            return last || this.test(context.data, expression);
        }), exports.$nor = function(context) {
            return context.param.reduce(utils.bind(function(last, expression) {
                return last && !this.test(context.data, expression);
            }, this), !0);
        }, exports.$not = function(context) {
            return !this.test(context.data, context.param);
        }, exports.$eq = function(context) {
            return utils.deepCompare(context.data, context.param);
        }, exports.$ne = function(context) {
            return !utils.deepCompare(context.data, context.param);
        }, exports.$lt = function(context) {
            return context.data < context.param;
        }, exports.$lte = function(context) {
            return context.data <= context.param;
        }, exports.$gt = function(context) {
            return context.data > context.param;
        }, exports.$gte = function(context) {
            return context.data >= context.param;
        }, exports.$in = function(context) {
            var a = utils.asArray(context.data);
            return utils.asArray(context.param).some(function(e) {
                return a.indexOf(e) >= 0;
            });
        }, exports.$nin = function(context) {
            var a = utils.asArray(context.data);
            return utils.asArray(context.param).every(function(e) {
                return a.indexOf(e) < 0;
            });
        }, exports.$exists = function(context) {
            return !(context.param ^ null !== context.data);
        }, exports.$type = function(context) {
            return typeof context.data === context.param;
        }, exports.$regex = function(context) {
            var r = context.param;
            return r instanceof RegExp || (r = new RegExp(r, context.expression.$options)), 
            context.data ? null !== context.data.match(r) : !1;
        }, exports.$options = noopHandler, exports.$where = function(context) {
            return context.param.call(null, context.data);
        }, exports.$all = function(context) {
            var a = utils.asArray(context.data);
            return context.param.every(function(e) {
                return a.indexOf(e) >= 0;
            });
        }, exports.$elemMatch = function(context) {
            return Array.isArray(context.data) && context.data.some(function(e) {
                return this.test(e, context.param);
            }, this);
        }, exports.$size = function(context) {
            return context.param === (Array.isArray(context.data) ? context.data.length : 0);
        }, exports.$literal = function(context) {
            return context.param;
        }, exports.$toLower = function(context) {
            return (this.evaluate(context.data, context.param) || "").toLowerCase();
        }, exports.$toUpper = function(context) {
            return (this.evaluate(context.data, context.param) || "").toUpperCase();
        }, exports.$ifNull = function(context) {
            var result = this.evaluate(context.data, context.param[0]);
            return null !== result ? result : this.evaluate(context.data, context.param[1]);
        }, exports.$cond = function(context) {
            var result = this.test(context.data, context.param["if"]);
            return result ? this.evaluate(context.data, context.param.then) : this.evaluate(context.data, context.param["else"]);
        }, exports.$add = reduceParamOperation(0, function(context, expression, sum) {
            return sum + this.evaluate(context.data, expression);
        }), exports.$subtract = reduceParamOperation(function(context, expression, diff) {
            var value = this.evaluate(context.data, expression);
            return null === diff ? value : diff - value;
        }), exports.$multiply = reduceParamOperation(1, function(context, expression, product) {
            return product * this.evaluate(context.data, expression);
        }), exports.$divide = reduceParamOperation(function(context, expression, quotient) {
            var value = this.evaluate(context.data, expression);
            return null === quotient ? value : quotient / value;
        }), exports.$mod = function(context) {
            return this.evaluate(context.data, context.param[0]) % this.evaluate(context.data, context.param[1]);
        };
    }), defineModule("./stages", function(require, module, exports) {
        "use strict";
        var utils = require("./utils"), iterationOperator = function(fn, before) {
            return function(context, next) {
                (!before || before.call(this, context)) && context.forEachItem(function(item, index) {
                    fn.call(this, context, item, index);
                }), next();
            };
        };
        exports.$group = function(context, next) {
            context.outputAll(this.group(context.data, context.param)), next();
        }, exports.$sort = function(context, next) {
            var sorted = context.data.sort(function(a, b) {
                for (var i = 0; i < context.paramKeys.length; i++) {
                    var key = context.paramKeys[i], av = a[key], bv = b[key], result = 0;
                    if (bv > av ? result = -1 : av > bv && (result = 1), result *= context.param[key], 
                    0 !== result) return result;
                }
                return 0;
            });
            context.outputAll(sorted), next();
        }, exports.$output = iterationOperator(function(context, item) {
            context.param.push(item), context.output(item);
        }, function(context) {
            return context.param && context.param.push;
        }), exports.$limit = iterationOperator(function(context, item, index) {
            index < context.param && context.output(item);
        }), exports.$skip = iterationOperator(function(context, item, index) {
            index >= context.param && context.output(item);
        }), exports.$match = iterationOperator(function(context, item) {
            this.test(item, context.param) && context.output(item);
        }), exports.$project = iterationOperator(function(context, item) {
            var result = {};
            context.forEachParamKey(function(key, paramValue) {
                var include = !1, value = item[key];
                paramValue === !0 || 1 === paramValue ? include = !0 : paramValue === !1 || 0 === paramValue ? include = !1 : (value = this.evaluate(item, paramValue), 
                include = !0), include && (result[key] = value);
            }), context.output(result);
        }), exports.$unwind = iterationOperator(function(context, item) {
            var key = context.param.slice(1), values = this.evaluate(item, context.param);
            if (null !== values && Array.isArray(values)) for (var k = 0; k < values.length; k++) {
                var clone = utils.deepClone(item);
                clone[key] = values[k], context.output(clone);
            }
        });
    }), defineModule("./stage-context", function(require, module) {
        "use strict";
        var StageContext = function(stage, data, critr) {
            var operatorName = Object.keys(stage)[0];
            this.results = [], this.data = data, this.count = data.length, this.stage = stage, 
            this.operator = critr.stage(operatorName), this.name = operatorName, this.param = stage[operatorName], 
            this.critr = critr, this.paramKeys = "object" == typeof this.param ? Object.keys(this.param) : [];
        };
        StageContext.prototype.forEachItem = function(fn) {
            var critr = this.critr;
            this.data.forEach(function(item, index) {
                fn.call(critr, item, index);
            });
        }, StageContext.prototype.outputAll = function(result) {
            result = result || [], this.results = this.results.concat(result);
        }, StageContext.prototype.output = function(result) {
            null !== result && this.results.push(result);
        }, StageContext.prototype.callOperator = function(callback) {
            var context = this;
            this.operator.call(this.critr, this, function() {
                callback(context.results);
            });
        }, StageContext.prototype.forEachParamKey = function(fn) {
            var critr = this.critr, param = this.param;
            this.paramKeys.forEach(function(key) {
                fn.call(critr, key, param[key]);
            });
        };
        var StageContextFactory = function(critr) {
            this.critr = critr;
        };
        StageContextFactory.prototype.create = function(options) {
            return new StageContext(options.stage, options.data, this.critr);
        }, module.exports = StageContextFactory;
    }), defineModule("./grouper", function(require, module) {
        "use strict";
        var Grouper = function(_idExpression) {
            this._idExpression = _idExpression, this.lookup = {}, this.ids = [];
        };
        Grouper.prototype.makeFilter = function() {
            var grouper = this;
            return function(item) {
                var _id = this.evaluate(item, grouper._idExpression);
                grouper.ids.indexOf(_id) < 0 ? (grouper.ids.push(_id), grouper.lookup[_id] = [ item ]) : grouper.lookup[_id].push(item);
            };
        }, Grouper.prototype.map = function(fn, thisArg) {
            for (var results = [], i = 0; i < this.ids.length; i++) results.push(fn.call(thisArg, this.ids[i], this.lookup[this.ids[i]]));
            return results;
        }, module.exports = Grouper;
    }), function(module) {
        "use strict";
        var utils = require("./utils"), Grouper = require("./grouper"), StageContextFactory = require("./stage-context"), makeOperatorStorageFn = function(containerName) {
            return function(key, handler, overwrite) {
                var container = this[containerName];
                if (1 === arguments.length) return container[key];
                if (key in container) {
                    if (!overwrite) return !1;
                    container[key] = handler;
                } else container[key] = handler;
                return !0;
            };
        }, Critr = function(options) {
            options = options || {}, this.stages = {}, this.operators = {}, this.accumulators = {}, 
            options.defaults && (this.operators = Object.create(Critr.defaults.operators)), 
            options.defaultStages && (this.stages = Object.create(Critr.defaults.stages)), options.defaultAccumulators && (this.accumulators = Object.create(Critr.defaults.accumulators));
        };
        Critr.defaults = {
            accumulators: require("./accumulators"),
            stages: require("./stages"),
            operators: require("./operators")
        }, Critr.prototype.Critr = Critr, Critr.prototype.stage = makeOperatorStorageFn("stages"), 
        Critr.prototype.accumulator = makeOperatorStorageFn("accumulators"), Critr.prototype.operator = makeOperatorStorageFn("operators"), 
        Critr.prototype.test = function(data, criteria) {
            for (var result = !1, properties = utils.getProperties(criteria); properties.length > 0; ) {
                var p = properties.shift(), target = data ? utils.resolve(data, p.key) : null;
                if ("$" !== p.key[0]) "object" != typeof p.value ? result = p.value === target : p.value && (result = this.test(target, p.value)); else {
                    var operator = this.operator(p.key);
                    if (!operator) throw new Error(p.key + " operator is not supported.");
                    result = !!operator.call(this, {
                        param: p.value,
                        data: data,
                        expression: criteria
                    });
                }
                if (!result) break;
            }
            return result;
        }, Critr.prototype.evaluate = function(obj, expression) {
            var result = null;
            if ("string" == typeof expression && "$" === expression[0]) result = utils.resolve(obj, expression.slice(1)); else if ("number" == typeof expression) result = expression; else for (var expressionProperties = utils.getProperties(expression), i = 0; i < expressionProperties.length; i++) {
                var p = expressionProperties[i], operator = this.operator(p.key);
                if (!operator) throw new Error(p.key + " operator is not supported.");
                result = operator.call(this, {
                    param: p.value,
                    data: obj,
                    expression: expression
                });
            }
            return result;
        }, Critr.prototype.pipe = function(data, stages, callback) {
            data = (data || []).slice(0);
            var stageIndex = -1, contextFactory = new StageContextFactory(this), nextStage = function() {
                if (++stageIndex >= stages.length) return callback(data);
                var stage = stages[stageIndex], context = contextFactory.create({
                    stage: stage,
                    data: data
                });
                return context.operator ? void context.callOperator(function(results) {
                    data = results, utils.defer(nextStage);
                }) : callback(null, new Error(context.name + " is not a known stage operator."));
            };
            utils.defer(nextStage);
        }, Critr.prototype.group = function(data, expression) {
            var grouper = new Grouper(expression._id || "");
            data.forEach(grouper.makeFilter(), this);
            var accumulators = utils.map(utils.getProperties(expression).filter(function(p) {
                return !grouper._idExpression || p.value !== grouper._idExpression;
            }), function(expressionProperty) {
                var key = null;
                return key = Object.keys(expressionProperty.value)[0], {
                    accumulatorKey: key,
                    accumulator: this.accumulator(key),
                    accumulatorExpression: expressionProperty.value[key],
                    expressionProperty: expressionProperty
                };
            }, this);
            return grouper.map(function(groupKey, group) {
                var result = {};
                return null !== grouper._idExpression && (result._id = groupKey), accumulators.forEach(function(a) {
                    if (!a.accumulator) throw new Error(a.accumulatorKey + " accumulator is not supported.");
                    result[a.expressionProperty.key] = a.accumulator.call(this, group, a.accumulatorExpression);
                }, this), result;
            }, this);
        }, Critr.prototype.count = function(data, query) {
            return query ? (data = utils.asArray(data), utils.isEmptyObject(query) ? data.length : data.reduce(utils.bind(function(last, item) {
                return this.test(item, query) ? last + 1 : last;
            }, this), 0)) : 0;
        }, module.exports = new Critr({
            defaults: !0,
            defaultStages: !0,
            defaultAccumulators: !0
        });
    }(function(root) {
        return Object.defineProperty({}, "exports", {
            set: function(i) {
                root.critr = i;
            },
            get: function() {
                return root.critr;
            }
        });
    }(this));
}).call(this);