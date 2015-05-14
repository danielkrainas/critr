var chai = require('chai');
var expect = chai.expect;
var critr = require('../../lib/critr');

describe('Critr:', function () {
    var data;

    describe('evaluate', function () {
        beforeEach(function () {
            data = { name: 'bob', home: { windows: 2, exits: [{ location: 'front' }, { location: 'back' }] } };
        });

        it('should return the evaluated expression', function () {
            expect(critr.evaluate(data, { $literal: 2 })).to.equal(2);
        });

        it('should throw error when encountering an unsupported operator', function () {
            expect(function () {
                critr.evaluate(data, { $unsupported: true });
            }).to.throw(Error);
        });
    });

    describe('test', function () {
        beforeEach(function () {
            data = { name: 'bob', home: { windows: 2, exits: [{ location: 'front' }, { location: 'back' }] } };
        });

        it('should return true if evaluation is truth', function () {
            expect(critr.test(data, { name: 'bob' })).to.be.true;
        });

        it('should return false if evaluation is false', function () {
            expect(critr.test(data, { name: 'fred' })).to.be.false;
        });

        it('should support deep comparisons', function () {
            expect(critr.test(data, { home: { windows: 2 }})).to.be.true;
            expect(critr.test(data, { home: { windows: 2, furnace: true }})).to.be.false;
        });

        it('should throw error when encountering an unsupported operator', function () {
            expect(function () {
                critr.test(data, { home: { $unsupported: true }});
            }).to.throw(Error);
        });
    });

    describe('group', function () {
        beforeEach(function () {
            data = [
                { name: 'bob', age: 5, gender: 'male' },
                { name: 'fred', age: 7, gender: 'male' },
                { name: 'sarah', age: 22, gender: 'female' }
            ];
        });

        it('should group values according to _id expression', function () {
            var result = critr.group(data, { _id: '$gender' });
            expect(result).to.have.length(2);
            expect(result[0]).to.have.property('_id', 'male');
            expect(result[1]).to.have.property('_id', 'female');
        });

        it('should throw error when encountering unsupported accumulator', function () {
            expect(function () {
                critr.group(data, { _id: '$gender', age: { $unsupported: true }});
            }).to.throw(Error);
        });
    });

    describe('pipe', function () {
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

        it('should return null when encountering an unsupported stage', function (done) {
            critr.pipe(data, [
                { $unsupported: true }
            ], function (result) {
                expect(result).to.be.null;
                done();
            });
        });
    });

    describe('count', function () {
        beforeEach(function () {
            data = [
                { name: 'bob', age: 5, gender: 'male' },
                { name: 'fred', age: 7, gender: 'male' },
                { name: 'sarah', age: 22, gender: 'female' }
            ];
        });

        it('should return count of items matching query', function () {
            expect(critr.count(data, { gender: 'female' })).to.equal(1);
        });

        it('should return total count of items if query is empty', function () {
            expect(critr.count(data, {})).to.equal(3);
        });

        it('should return 0 if query is null', function () {
            expect(critr.count(data, null)).to.equal(0);
        });
    });
});
