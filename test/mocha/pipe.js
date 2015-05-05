var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Pipe:', function () {
    var data;

    describe('flow', function () {
        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' },
                { name: 'john' }
            ];
        });

        it('should return result after running data through $skip and $limit operations', function (done) {
            critr.pipe(data, [
                { $skip: 1 },
                { $limit: 1 }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.equal(data[1]);
                done();
            });
        });
    });
});
