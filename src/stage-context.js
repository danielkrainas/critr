var StageContext = function (stage, data, critr) {
    var operatorName = Object.keys(stage)[0];

    this.results = [];
    this.data = data;
    this.count = data.length;
    this.stage = stage;
    this.operator = critr.stage(operatorName);
    this.name = operatorName;
    this.param = stage[operatorName];
    this.critr = critr;
    this.paramKeys = typeof this.param === 'object' ? Object.keys(this.param) : [];
};

StageContext.prototype.forEachItem = function (fn) {
    var critr = this.critr;
    this.data.forEach(function (item, index) {
        fn.call(critr, item, index);
    });
};

StageContext.prototype.outputAll = function (result) {
    result = result || [];
    this.results = this.results.concat(result);
};

StageContext.prototype.output = function (result) {
    if (result !== null) {
        this.results.push(result);
    }            
};

StageContext.prototype.callOperator = function (callback) {
    var context = this;
    this.operator.call(this.critr, this, function () {
        callback(context.results);
    });
};

StageContext.prototype.forEachParamKey = function (fn) {
    var critr = this.critr;
    var param = this.param;
    this.paramKeys.forEach(function (key) {
        fn.call(critr, key, param[key]);
    });
};

var StageContextFactory = function (critr) {
    this.critr = critr;
};

StageContextFactory.prototype.create = function (options) {           
    return new StageContext(options.stage, options.data, this.critr);
};

module.exports = StageContextFactory;