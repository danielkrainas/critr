"use strict";

var keySorter = function (a, b) {
    return a.key > b.key;
};

exports.isEmptyObject = function (obj) {
    return JSON.stringify(obj) === '{}';
};

exports.bind = function (fn, thisArg) {
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        return fn.apply(thisArg, args);
    };
};

var map = exports.map = function (arr, fn, thisArg) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        result.push(fn.call(thisArg, arr[i], i));
    }

    return result;
};

var getProperties = exports.getProperties = function (obj) {
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

var deepClone = exports.deepClone = function (obj) {
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

exports.resolve = function (obj, path) {
    var paths = path.split('.');
    for (var i = 0; i < paths.length; i++) {
        if (typeof obj[paths[i]] === 'undefined') {
            return null;
        }

        obj = obj[paths[i]];
    }

    return obj;
};

var deepCompare = exports.deepCompare = function (a, b) {
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

exports.asArray = function (obj) {
    return Array.isArray(obj) ? obj : [obj];
};

exports.defer = function (fn, args) {
    return setTimeout(function () {
        fn.apply(null, args || []);
    }, 0);
};
