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
});
