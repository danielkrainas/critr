var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Critr:', function () {
    var data;

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
