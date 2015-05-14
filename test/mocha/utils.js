var chai = require('chai');
var expect = chai.expect;
var utils = require('../../src/utils');

describe('Utils:', function () {
    var data;

    describe('deepCompare', function () {
        beforeEach(function () {
            data = { name: 'bob', home: { windows: 2 }};
        });

        it('should return true if objects are deeply equal', function () {
            expect(utils.deepCompare({ name: 'bob', home: { windows: 2 }}, data)).to.be.true;
        });

        it('should return false if objects are not deeply equal', function () {
            expect(utils.deepCompare({ name: 'bob', home: { windows: 3 }}, data)).to.be.false;
        });
    });
});
