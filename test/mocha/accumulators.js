var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Accumulators:', function () {
    var data;

    beforeEach(function () {
        data = [
            { name: 'bob', age: 5 },
            { name: 'fred', age: 2 },
            { name: 'john', age: 3 }
        ];
    });

    describe('$sum', function () {
        it('should sum values together', function (done) {
            critr.pipe(data, [
                { 
                    $group: {
                        age: { $sum: '$age' }
                    }
                }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.have.property('age', 10);
                done();
            });
        });
    });
});
