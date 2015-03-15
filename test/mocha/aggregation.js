var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Aggregation:', function () {
    var data;

    describe('$limit', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should truncate data to length no greater than specified', function () {
            var result = critr.aggregate(data, [
                {
                    $limit: 1
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[0]);
        });
    });

    describe('$skip', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should skip specified number of elements', function () {
            var result = critr.aggregate(data, [
                {
                    $skip: 1
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[1]);
        });
    });

    describe('$match', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', age: 32 },
                { name: 'fred', age: 12 }
            ];
        });

        it('should only return elements that match expression', function () {
            var result = critr.aggregate(data, [
                {
                    $match: { age: { $gt: 15 } }
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[0]);
        });
    });
});
