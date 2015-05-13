"use strict";

var Grouper = function (_idExpression) {
    this._idExpression = _idExpression;
    this.lookup = {};
    this.ids = [];
};

Grouper.prototype.makeFilter = function () {
    var grouper = this;
    return function (item) {
        var _id = this.evaluate(item, grouper._idExpression);
        if (grouper.ids.indexOf(_id) < 0) {
            grouper.ids.push(_id);
            grouper.lookup[_id] = [item];
        } else {
            grouper.lookup[_id].push(item);
        }
    };
};

Grouper.prototype.groups = function (fn, thisArg) {
    for (var i = 0; i < this.ids.length; i++) {
        fn.call(thisArg, this.ids[i], this.lookup[this.ids[i]]);
    }
};

Grouper.prototype.map = function (fn, thisArg) {
    var results = [];
    for (var i = 0; i < this.ids.length; i++) {
        results.push(fn.call(thisArg, this.ids[i], this.lookup[this.ids[i]]));
    }

    return results;
};

module.exports = Grouper;
