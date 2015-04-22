"use strict";

(function (global, exports) {

    var defer = function (fn, args) {
        args = args || [];
        return setTimeout(function () {
            fn.apply(null, args);
        }, 0);
    };

    var $filters = {
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
                if (test(item, context.param)) {
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
                        value = evaluate(item, paramValue);
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
                var values = evaluateFieldExpression(item, context.param);
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
    };

    var defaultOperators = {
        and: function (context) {
            return context.value.reduce(function (p, criteria) {
                return p && test(context.data, criteria);
            }, true);
        },

        or: function (context) {
            return context.value.reduce(function (p, criteria) {
                return p || test(context.data, criteria);
            }, false);
        },

        nor: function (context) {
            return context.value.reduce(function (p, criteria) {
                return p && !test(context.data, criteria);
            }, true);
        },

        not: function (context) {
            return !test(context.data, context.value);
        },

        eq: function (context) {
            return deepCompare(context.data, context.value);
        },

        ne: function (context) {
            return !deepCompare(context.data, context.value);
        },

        lt: function (context) {
            return context.data < context.value;
        },

        lte: function (context) {
            return context.data <= context.value;
        },

        gt: function (context) {
            return context.data > context.value;
        },

        gte: function (context) {
            return context.data >= context.value;
        },

        in: function (context) {
            var a = asArray(context.data);
            return asArray(context.value).some(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        nin: function (context) {
            var a = asArray(context.data);
            return asArray(context.value).every(function (e) {
                return a.indexOf(e) < 0;
            });
        },

        exists: function (context) {
            return !(context.value ^ (context.data !== null));
        },

        type: function (context) {
            return typeof context.data === context.value;
        },

        mod: function (context) {
            return (context.data % context.value[0]) === context.value[1];
        },

        regex: function (context) {
            var r = context.value;
            if (!(r instanceof RegExp)) {
                r = new RegExp(r, context.criteria.$options);
            }

            return context.data.match(r) !== null;
        },

        'options': true,

        where: function (context) {
            return context.value.call(null, context.data);
        },

        all: function (context) {
            var a = asArray(context.data);
            return context.value.every(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        elemMatch: function (context) {
            return Array.isArray(context.data) && context.data.some(function (e) {
                return test(e, context.value);
            });
        },

        size: function (context) {
            return context.value === (Array.isArray(context.data) ? context.data.length : 0);
        }
    };

    var operators = {};


    function noopHandler() {
        return true;
    }

    function deepClone(obj) {
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
    }

    function registerDefaults(overwrite) {
        for (var key in defaultOperators) {
            var handler = defaultOperators[key];
            if (handler === true) {
                registerValueOp(key, overwrite);
            } else {
                registerOp(key, handler, overwrite);
            }
        }
    }

    function registerOp(key, handler, overwrite) {
        key = '$' + key;
        if (key in operators) {
            if (overwrite) {
                operators[key] = handler;
            } else {
                return false;
            }
        } else {
            operators[key] = handler;
        }

        return true;
    }

    function registerValueOp(key, overwrite) {
        return registerOp(key, noopHandler, overwrite);
    }

    function clearRegistration() {
        operators = {};
    }

    function resetOps() {
        clearRegistration();
        registerDefaults();
    }

    function resolve(obj, path) {
        var paths = path.split('.');
        for (var i = 0; i < paths.length; i++) {
            if (typeof obj[paths[i]] === 'undefined') {
                return null;
            } else {
                obj = obj[paths[i]];
            }
        }

        return obj;
    }

    function getProperties(obj) {
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
    }

    function deepCompare(a, b) {
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
    }

    function asArray(obj) {
        return Array.isArray(obj) ? obj : [obj];
    }

    function test(data, criteria) {
        var result = false;
        for (var key in criteria) {
            var value = criteria[key];
            if (key[0] !== '$') {
                if (typeof value !== 'object') {
                    result = deepCompare(resolve(data, key), value);
                } else {
                    result = test(resolve(data, key), value);
                }
            } else {
                if (key in operators) {
                    result = operators[key].call(null, {
                        value: value, 
                        data: data,
                        criteria: criteria
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
    }

    function evaluateFieldExpression(obj, expression) {
        return resolve(obj, expression.slice(1));
    }

    function evaluate(obj, expression) {
        var result = null;
        if (typeof expression === 'string' && expression[0] === '$') {
            result = evaluateFieldExpression(obj, expression);
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
    }

    function aggregate(data, operations, callback) {
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
                var filter = $filters[filterName];
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
                    outputAll: outputAll
                };

                filter.call(null, context, function () {
                    defer(nextFilter);
                });
            };

            defer(nextFilter);
        };

        defer(nextOperation);
    }

    registerDefaults(true);
    exports.registerDefaults = registerDefaults;
    exports.registerOp = registerOp;
    exports.registerValueOp = registerValueOp;
    exports.clearRegistration = clearRegistration;
    exports.resetOps = resetOps;
    exports.aggregate = aggregate;
    exports.test = test;
    
})(this, typeof exports !== 'undefined' ? exports : (this.Critr = {}));