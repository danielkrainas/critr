"use strict";

(function () {

    var noopHandler = function () {
        return true;
    };

    var defaults = {
        filters: {
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
                    context.data.forEach(function (item, index) {
                        context.param.push(item);
                        context.output(item);
                    });
                }

                next();
            },

            $limit: function (context, next) {
                context.data.forEach(function (item, index) {
                    if (index < context.param) {
                        context.output(item);
                    }
                });

                next();
            },

            $skip: function (context, next) {
                context.data.forEach(function (item, index) {
                    if (index >= context.param) {
                        context.output(item);
                    }
                });

                next();
            },

            $match: function (context, next) {
                context.data.forEach(function (item, index) {
                    if (context._.test(item, context.param)) {
                        context.output(item);
                    }
                });

                next();            
            },

            $project: function (context, next) {
                context.data.forEach(function (item, index) {
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
                            value = context._.evaluate(item, paramValue);
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
                context.data.forEach(function (item, index) {
                    var key = context.param.slice(1);
                    var values = context._.evaluateFieldExpression(item, context.param);
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
                return context.value.reduce(function (p, criteria) {
                    return p && context._.test(context.data, criteria);
                }, true);
            },

            $or: function (context) {
                return context.value.reduce(function (p, criteria) {
                    return p || context._.test(context.data, criteria);
                }, false);
            },

            $nor: function (context) {
                return context.value.reduce(function (p, criteria) {
                    return p && !context._.test(context.data, criteria);
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
                    r = new RegExp(r, context.criteria.$options);
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

    var Critr = (function () {
        var Critr = function (options) {
            options = options || {};
            this.filters = {};
            this.operators = {};

            if (options.defaults) {
                this.operators = Object.create(defaults.operators);
            }

            if (options.defaultFilters) {
                this.filters = Object.create(defaults.filters);
            }
        };

        Critr.prototype.Critr = Critr;

        Critr.prototype.registerOp = function (key, handler, overwrite) {
            key = '$' + key;
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

        Critr.prototype.registerValueOp = function (key, overwrite) {
            return this.registerOp(key, noopHandler, overwrite);
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
                    if (key in this.operators) {
                        result = this.operators[key].call(this, {
                            value: value, 
                            data: data,
                            criteria: criteria,
                            _: this
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
                    if (key === '$literal') {
                        result = value;
                        break;
                    }
                }
            }

            return result;
        };

        Critr.prototype.aggregate = function (data, operations, callback) {
            var _ = this;
            data = (data || []).slice(0);
            var operationIndex = -1;

            var nextOperation = function () {
                if (++operationIndex >= operations.length) {
                    return callback(data);
                }

                var op = operations[operationIndex];
                var opFilters = Object.keys(op);
                var filterIndex = -1;
                var results = [];

                var outputAll = function (result) {
                    result = result || [];
                    results = results.concat(result);
                };

                var output = function (result) {
                    if (result !== null) {
                        results.push(result);
                    }
                };

                var nextFilter = function () {
                    if (++filterIndex >= opFilters.length) {
                        data = results;
                        return defer(nextOperation);
                    }

                    var filterName = opFilters[filterIndex];
                    var filter = _.filters[filterName];
                    if (!filter) {
                        // throw an error or something. `filterName` is not a known filter
                        return defer(nextFilter);
                    }

                    var filterParam = op[filterName];

                    var context = {
                        count: data.length,
                        data: data,
                        operation: op,
                        filter: filter,
                        filterName: filterName,
                        param: filterParam,
                        output: output,
                        outputAll: outputAll,
                        _: _
                    };

                    filter.call(_, context, function () {
                        defer(nextFilter);
                    });
                };

                defer(nextFilter);
            };

            defer(nextOperation);
        };

        return Critr;
    })();

    var instance = new Critr({
        defaults: true,
        defaultFilters: true
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    } else {
        this.Critr = instance;
    }
}).call(this);