"use strict";

var utils = require('./utils');

exports.$sum = function (data, expression) {
    return data.reduce(utils.bind(function (total, item) {
        if (typeof expression === 'number') {
            return total + expression;
        }

        return total + this.evaluate(item, expression);
    }, this), 0);
};

exports.$avg = function (data, expression) {
    var total = exports.$sum(data, expression);
    return total / data.length;
};

exports.$first = function (data, expression) {
    return this.evaluate(data[0], expression);
};

exports.$last = function (data, expression) {
    return this.evaluate(data[data.length - 1], expression);
};

exports.$max = function (data, expression) {
    return data.reduce(utils.bind(function (max, item) {
        var value = this.evaluate(item, expression);
        return max === null ? value : Math.max(max, value);
    }, this), null);
};

exports.$min = function (data, expression) {
    return data.reduce(utils.bind(function (min, item) {
        var value = this.evaluate(item, expression);
        return min === null ? value : Math.min(min, value);
    }, this), null);
};

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
