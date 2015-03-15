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

        it('should return truncated data set with length no greater than specified', function () {
            var result = critr.aggregate(data, [
                {
                    $limit: 1
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[0]);
        });
    });
});
