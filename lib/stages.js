"use strict";

var utils = require('./utils');

var iterationOperator = function (fn, before) {
    return function (context, next) {
        if (!before || before.call(this, context)) {
            context.forEachItem(function (item, index) {
                fn.call(this, context, item, index);
            });
        }

        next();
    };
};

exports.$group = function (context, next) {
    context.outputAll(this.group(context.data, context.param));
    next();
};

exports.$sort = function (context, next) {
    var sorted = context.data.sort(function (a, b) {
        for (var i = 0; i < context.paramKeys.length; i++) {
            var key = context.paramKeys[i];
            var av = a[key];
            var bv = b[key];

            var result = 0;
            if (av < bv) {
                result = -1;
            } else if (av > bv) {
                result = 1;
            }

            result *= context.param[key];
            if (result !== 0) {
                return result;
            }
        }

        return 0;
    });

    context.outputAll(sorted);
    next();
};

exports.$output = iterationOperator(function (context, item) {
    context.param.push(item);
    context.output(item);
}, function (context) {
    return context.param && context.param.push;
});

exports.$limit = iterationOperator(function (context, item, index) {
    if (index < context.param) {
        context.output(item);
    }
});

exports.$skip = iterationOperator(function (context, item, index) {
    if (index >= context.param) {
        context.output(item);
    }
});

exports.$match = iterationOperator(function (context, item) {
    if (this.test(item, context.param)) {
        context.output(item);
    }
});

exports.$project = iterationOperator(function (context, item) {
    var result = {};
    context.forEachParamKey(function (key, paramValue) {
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
    });

    context.output(result);
});

exports.$unwind = iterationOperator(function (context, item) {
    var key = context.param.slice(1);
    var values = this.evaluate(item, context.param);
    if (values !== null && Array.isArray(values)) {
        for (var k = 0; k < values.length; k++) {
            var clone = utils.deepClone(item);
            clone[key] = values[k];
            context.output(clone);
        }
    }
});