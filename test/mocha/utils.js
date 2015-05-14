var chai = require('chai');
var expect = chai.expect;
var utils = require('../../lib/utils');

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
            expect(utils.deepCompare({ name: 'bob', home: { windows: 3, doors: 1 }}, data)).to.be.false;
        });
    });

    describe('getProperties', function () {
        it('should return array of ownProperties of object', function () {
            var result = utils.getProperties({ name: 'bob', age: 52 });
            expect(result).to.have.length(2);
            expect(result[0]).to.have.property('key', 'name')
            expect(result[0]).to.have.property('value', 'bob');
        });

        it('should return empty array for non-objects', function () {
            expect(utils.getProperties('not-object')).to.be.empty;
        });

        it('should return empty array for null object values', function () {
            expect(utils.getProperties(null)).to.be.empty;
        });
    });
});
