(function (global, exports) {

    var defaultOperators = {
        and: function (value, data, criteria) {
            return value.reduce(function (p, criteria) {
                return p && test(data, criteria);
            }, true);
        },

        or: function (value, data, criteria) {
            return value.reduce(function (p, criteria) {
                return p || test(data, criteria);
            }, false);
        },

        nor: function (value, data, criteria) {
            return value.reduce(function (p, criteria) {
                return p && !test(data, criteria);
            }, true);
        },

        not: function (value, data, criteria) {
            return !test(data, value);
        },

        eq: function (value, data, criteria) {
            return deepCompare(data, value);
        },

        ne: function (value, data, criteria) {
            return !deepCompare(data, value);
        },

        lt: function (value, data, criteria) {
            return data < value;
        },

        lte: function (value, data, criteria) {
            return data <= value;
        },

        gt: function (value, data, criteria) {
            return data > value;
        },

        gte: function (value, data, criteria) {
            return data >= value;
        },

        in: function (value, data, criteria) {
            var a = asArray(data);
            return asArray(value).some(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        nin: function (value, data, criteria) {
            var a = asArray(data);
            return asArray(value).every(function (e) {
                return a.indexOf(e) < 0;
            });
        },

        exists: function (value, data, criteria) {
            return !(value ^ (data !== null));
        },

        type: function (value, data, criteria) {
            return typeof data === value;
        },

        mod: function (value, data, criteria) {
            return (data % value[0]) === value[1];
        },

        regex: function (value, data, criteria) {
            var r = value;
            if (!(r instanceof RegExp)) {
                r = new RegExp(r, criteria.$options);
            }

            return data.match(r) !== null;
        },

        'options': true,

        where: function (value, data, criteria) {
            return value.call(null, data);
        },

        all: function (value, data, criteria) {
            var a = asArray(data);
            return value.every(function (e) {
                return a.indexOf(e) >= 0;
            });
        },

        elemMatch: function (value, data, criteria) {
            return Array.isArray(data) && data.some(function (e) {
                return test(e, value);
            });
        },

        size: function (value, data, criteria) {
            return value === (Array.isArray(data) ? data.length : 0);
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
                    result = operators[key](value, data, criteria);
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

    function aggregate(data, operations) {
        data = (data || []).slice(0);
        var finalResults = null;
        for (var i = 0; i < operations.length; i++) {
            var op = operations[i];
            var results = finalResults || [];
            for (var j = 0; j < data.length; j++) {
                var item = data[j];
                var result = null;
                for (var key in op) {
                    var value = op[key];
                    if (key[0] !== '$') {

                    } else {
                        if (key === '$limit') {
                            if (j < value) {
                                result = item;
                            }
                        } else if (key === '$skip') {
                            if (j >= value) {
                                result = item;
                            }
                        } else if (key === '$match') {
                            if (test(item, value)) {
                                result = item;
                            }
                        } else if (key === '$project') {
                            result = {};
                            for (var valueKey in value) {
                                var valueValue = value[valueKey];
                                var include = false;
                                var targetValue = item[valueKey];
                                if (valueValue === true || valueValue === 1) {
                                    include = true;
                                } else if (valueValue === false || valueValue === 0) {
                                    include = false;
                                } else {
                                    targetValue = evaluate(item, valueValue);
                                    include = true;
                                }

                                if (include) {
                                    result[valueKey] = targetValue;
                                }
                            }
                        } else if (key === '$unwind') {
                            var targetKey = value.slice(1);
                            var valueItems = evaluateFieldExpression(item, value);
                            if (valueItems !== null && Array.isArray(valueItems)) {
                                result = [];
                                for (var k = 0; k < valueItems.length; k++) {
                                    var clone = deepClone(item);
                                    clone[targetKey] = valueItems[k];
                                    result.push(clone);
                                }
                            }
                        }
                    }
                }

                if (Array.isArray(result)) {
                    result.forEach(function (r) {
                        results.push(r);
                    });
                } else if (result !== null) {
                    results.push(result);
                }
            }

            if (!results.length) {
                break;
            } else {
                finalResults = results;
            }
        }

        return finalResults || [];
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
