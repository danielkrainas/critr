"use strict";

var utils = require('./utils');

var reduce = function (data, startValue, fn) {
    return data.reduce(utils.bind(fn, this), startValue);
};

var reduceDataOperation = function (startValue, fn) {
    if (arguments.length === 1) {
        fn = startValue;
        startValue = null;
    }

    return function (data, expression) {
        return reduce.call(this, data, startValue, function (last, item) {
            return fn.call(this, expression, item, last);
        });
    };
};

var $sum = exports.$sum = reduceDataOperation(0, function (expression, item, total) {
    if (typeof expression === 'number') {
        return total + expression;
    }

    return total + this.evaluate(item, expression);
});

exports.$avg = function (data, expression) {
    var total = $sum.call(this, data, expression);
    return total / data.length;
};

exports.$first = function (data, expression) {
    return this.evaluate(data[0], expression);
};

exports.$last = function (data, expression) {
    return this.evaluate(data[data.length - 1], expression);
};

exports.$max = reduceDataOperation(null, function (expression, item, max) {
    var value = this.evaluate(item, expression);
    return max === null ? value : Math.max(max, value);
});

exports.$min = reduceDataOperation(null, function (expression, item, min) {
    var value = this.evaluate(item, expression);
    return min === null ? value : Math.min(min, value);
});

exports.$push = function (data, expression) {
    return data.map(utils.bind(function (item) {
        return this.evaluate(item, expression);
    }, this));
};

exports.$addToSet = function (data, expression) {
    var set = [];
    data.forEach(utils.bind(function (item) {
        var value = this.evaluate(item, expression);
        if (set.indexOf(value) < 0) {
            set.push(value);
        }
    }, this));

    return set;
};
