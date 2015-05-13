"use strict";
/*jslint bitwise: true*/

var utils = require('./utils');

var noopHandler = function () {
    /* istanbul ignore next  */
    return true;
};

exports.$and = function (context) {
    return context.param.reduce(utils.bind(function (last, expression) {
        return last && this.test(context.data, expression);
    }, this), true);
};

exports.$or = function (context) {
    return context.param.reduce(utils.bind(function (last, expression) {
        return last || this.test(context.data, expression);
    }, this), false);
};

exports.$nor = function (context) {
    return context.param.reduce(utils.bind(function (last, expression) {
        return last && !this.test(context.data, expression);
    }, this), true);
};

exports.$not = function (context) {
    return !this.test(context.data, context.param);
};

exports.$eq = function (context) {
    return utils.deepCompare(context.data, context.param);
};

exports.$ne = function (context) {
    return !utils.deepCompare(context.data, context.param);
};

exports.$lt = function (context) {
    return context.data < context.param;
};

exports.$lte = function (context) {
    return context.data <= context.param;
};

exports.$gt = function (context) {
    return context.data > context.param;
};

exports.$gte = function (context) {
    return context.data >= context.param;
};

exports.$in = function (context) {
    var a = utils.asArray(context.data);
    return utils.asArray(context.param).some(function (e) {
        return a.indexOf(e) >= 0;
    });
};

exports.$nin = function (context) {
    var a = utils.asArray(context.data);
    return utils.asArray(context.param).every(function (e) {
        return a.indexOf(e) < 0;
    });
};

exports.$exists = function (context) {
    return !(context.param ^ (context.data !== null));
};

exports.$type = function (context) {
    return typeof context.data === context.param;
};

exports.$regex = function (context) {
    var r = context.param;
    if (!(r instanceof RegExp)) {
        r = new RegExp(r, context.expression.$options);
    }

    return context.data ? context.data.match(r) !== null : false;
};

exports.$options = noopHandler;

exports.$where = function (context) {
    return context.param.call(null, context.data);
};

exports.$all = function (context) {
    var a = utils.asArray(context.data);
    return context.param.every(function (e) {
        return a.indexOf(e) >= 0;
    });
};

exports.$elemMatch = function (context) {
    return Array.isArray(context.data) && context.data.some(function (e) {
        return this.test(e, context.param);
    }, this);
};

exports.$size = function (context) {
    return context.param === (Array.isArray(context.data) ? context.data.length : 0);
};

exports.$literal = function (context) {
    return context.param;
};

exports.$toLower = function (context) {
    return (this.evaluate(context.data, context.param) || '').toLowerCase();
};

exports.$toUpper = function (context) {
    return (this.evaluate(context.data, context.param) || '').toUpperCase();
};

exports.$ifNull = function (context) {
    var result = this.evaluate(context.data, context.param[0]);
    return result !== null ? result : this.evaluate(context.data, context.param[1]);
};

exports.$cond = function (context) {
    var result = this.evaluate(context.data, context.param.if);
    if (result) {
        return this.evaluate(context.data, context.param.then);
    } else {
        return this.evaluate(context.data, context.param.else);
    }
};

exports.$add = function (context) {
    return context.param.reduce(utils.bind(function (sum, expression) {
        return sum + this.evaluate(context.data, expression);
    }, this), 0);
};

exports.$subtract = function (context) {
    return context.param.reduce(utils.bind(function (diff, expression) {
        var value = this.evaluate(context.data, expression);
        return diff === null ? value : diff - value;
    }, this), null);
};

exports.$multiply = function (context) {
    return context.param.reduce(utils.bind(function (product, expression) {
        return product * this.evaluate(context.data, expression);
    }, this), 1);
};

exports.$divide = function (context) {
    return context.param.reduce(utils.bind(function (quotient, expression) {
        var value = this.evaluate(context.data, expression);
        return quotient === null ? value : quotient / value;
    }, this), null);
};

exports.$mod = function (context) {
    return this.evaluate(context.data, context.param[0]) % this.evaluate(context.data, context.param[1]);
};
