"use strict";
/*jslint bitwise: true*/

var utils = require('./utils');
var Grouper = require('./grouper');
var StageContextFactory = require('./stage-context');

var makeOperatorStorageFn = function (containerName) {
    return function (key, handler, overwrite) {
        var container = this[containerName];
        if (arguments.length === 1) {
            return container[key];
        }

        if (key in container) {
            if (overwrite) {
                container[key] = handler;
            } else {
                return false;
            }
        } else {
            container[key] = handler;
        }

        return true;
    };
};

var Critr = function (options) {
    options = options || {};
    this.stages = {};
    this.operators = {};
    this.accumulators = {};

    if (options.defaults) {
        this.operators = Object.create(Critr.defaults.operators);
    }

    if (options.defaultStages) {
        this.stages = Object.create(Critr.defaults.stages);
    }

    if (options.defaultAccumulators) {
        this.accumulators = Object.create(Critr.defaults.accumulators);
    }
};

Critr.defaults = {
    accumulators: require('./accumulators'),
    stages: require('./stages'),
    operators: require('./operators')
};

Critr.prototype.Critr = Critr;

Critr.prototype.stage = makeOperatorStorageFn('stages');

Critr.prototype.accumulator = makeOperatorStorageFn('accumulators');

Critr.prototype.operator = makeOperatorStorageFn('operators');

Critr.prototype.test = function (data, criteria) {
    var result = false;
    var properties = utils.getProperties(criteria);
    while(properties.length > 0) {
        var p = properties.shift();
        var target = data ? utils.resolve(data, p.key) : null;
        if (p.key[0] !== '$') {
            if (typeof p.value !== 'object') {
                result = p.value === target;
            } else if (p.value) {
                result = this.test(target, p.value);
            }
        } else {
            var operator = this.operator(p.key);
            if (operator) {
                result = !!operator.call(this, {
                    param: p.value,
                    data: data,
                    expression: criteria
                });
            } else {
                throw new Error(p.key + ' operator is not supported.');
            }
        }

        if (!result) {
            break;
        }
    }

    return result;
};

Critr.prototype.evaluate = function (obj, expression) {
    var result = null;
    if (typeof expression === 'string' && expression[0] === '$') {
        result = utils.resolve(obj, expression.slice(1));
    } else if (typeof expression === 'number') {
        result = expression;
    } else {
        for (var key in expression) {
            if (!expression.hasOwnProperty(key)) {
                continue;
            }

            var param = expression[key];
            var operator = this.operator(key);
            if (operator) {
                result = operator.call(this, {
                    param: param,
                    data: obj,
                    expression: expression
                });
            } else {
                throw new Error(key + ' operator is not supported.');
            }
        }
    }

    return result;
};

Critr.prototype.pipe = function (data, stages, callback) {
    data = (data || []).slice(0);
    var stageIndex = -1;
    var contextFactory = new StageContextFactory(this);

    var nextStage = function () {
        if (++stageIndex >= stages.length) {
            return callback(data);
        }

        var stage = stages[stageIndex];
        var context = contextFactory.create({
            stage: stage,
            data: data
        });

        if (!context.operator) {
            throw new Error(context.name + ' is not a known stage operator.');
        }

        context.callOperator(function (results) {
            data = results;
            utils.defer(nextStage);
        });
    };

    utils.defer(nextStage);
};

Critr.prototype.group = function (data, expression) {
    var grouper = new Grouper(expression._id || '');
    data.forEach(grouper.makeFilter(), this);
    var accumulators = utils.map(utils.getProperties(expression).filter(function (p) {
        return !grouper._idExpression || p.key !== grouper._idExpression;
    }), function (expressionProperty) {
        var key = Object.keys(expressionProperty.value)[0];
        return {
            accumulatorKey: key,
            accumulator: this.accumulator(key),
            accumulatorExpression: expressionProperty.value[key],
            expressionProperty: expressionProperty
        };
    }, this);

    return grouper.map(function (groupKey, group) {
        var result = {};
        if (grouper._idExpression !== null) {
            result._id = groupKey;
        }

        accumulators.forEach(function (a) {
            if (a.accumulator) {
                result[a.expressionProperty.key] = a.accumulator.call(this, group, a.accumulatorExpression);
            } else {
                throw new Error(a.accumulatorKey + ' accumulator is not supported.');
            }
        });

        return result;
    }, this);
};

Critr.prototype.count = function (data, query) {
    data = utils.asArray(data);
    return data.reduce(utils.bind(function (last, item) {
        return this.test(item, query) ? last + 1 : last;
    }, this), 0);
};

module.exports = new Critr({
    defaults: true,
    defaultStages: true,
    defaultAccumulators: true
});
