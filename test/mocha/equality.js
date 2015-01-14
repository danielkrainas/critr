var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Equality:', function () {

    describe('$eq', function () {
        it('should return true if found', function () {
            expect(critr.test({ name: 'bob' }, { name: { $eq: 'bob' }})).to.be.true;
        });
    });
});