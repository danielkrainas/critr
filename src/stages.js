var utils = require('./utils');

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

exports.$output = function (context, next) {
    if (context.param && context.param.push) {
        context.forEachItem(function (item) {
            context.param.push(item);
            context.output(item);
        });
    }

    next();
};

exports.$limit = function (context, next) {
    context.forEachItem(function (item, index) {
        if (index < context.param) {
            context.output(item);
        }
    });

    next();
};

exports.$skip = function (context, next) {
    context.forEachItem(function (item, index) {
        if (index >= context.param) {
            context.output(item);
        }
    });

    next();
};

exports.$match = function (context, next) {
    context.forEachItem(function (item) {
        if (this.test(item, context.param)) {
            context.output(item);
        }
    });

    next();
},

exports.$project = function (context, next) {
    context.forEachItem(function (item) {
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

    next();
};

exports.$unwind = function (context, next) {
    context.forEachItem(function (item) {
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

    next();
};
