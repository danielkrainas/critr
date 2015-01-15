var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Arrays:', function () {
    describe('$all', function () {
        it('should return true if all values are present', function () {
            expect(critr.test({ colors: ['blue', 'pink', 'orange']}, {
                colors: { $all: ['blue', 'orange'] }
            })).to.be.true;
        });

        it('should return false if only some values are present', function () {
            expect(critr.test({ colors: ['blue', 'pink', 'orange']}, {
                colors: { $all: ['blue', 'yellow'] }
            })).to.be.false;
        });

        it('should return false if no values are present', function () {
            expect(critr.test({ colors: ['blue', 'pink', 'orange']}, {
                colors: { $all: ['cyan', 'green', 'white'] }
            })).to.be.false;
        });
    });

    describe('$elemMatch', function () {
        var data = {
            people: [
                { name: 'bob', age: 5 },
                { name: 'fred', age: 7 },
                { name: 'sarah', age: 22 }
            ]
        };

        it('should return true if at least one element matches', function () {
            var query = {
                people: {
                    $elemMatch: {
                        name: { $eq: 'sarah' }
                    }
                }
            };

            expect(critr.test(data, query)).to.be.true;
        });

        it('should return false if no elements match', function () {
            var query = {
                people: {
                    $elemMatch: {
                        name: { $eq: 'name' }
                    }
                }
            };

            expect(critr.test(data, query)).to.be.false;
        });
    });

    describe('$size', function () {
        var data = {
            colors: ['orange', 'pink']
        };

        it('should return true if size matches', function () {
            expect(critr.test(data, { colors: { $size: 2 }})).to.be.true;
        });

        it('should return false if size does not match', function () {
            expect(critr.test(data, { colors: { $size: 4 }})).to.be.false;
        });
    });
});
