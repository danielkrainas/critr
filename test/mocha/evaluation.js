var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Fields:', function () {
    describe('$mod', function () {
        it('should return true if remainder is the same', function () {
            expect(critr.test({ age: 4 }, { age: { $mod: [2, 0]}})).to.be.true;
        });

        it('should return false if remainder is not the same', function () {
            expect(critr.test({ age: 5 }, { age: { $mod: [2, 0]}})).to.be.false;
        });
    });

    describe('$regex', function () {
        it('should return true if pattern matches', function () {
            expect(critr.test({ name: 'bob' }, { name: {$regex: 'b.+b' }})).to.be.true;
        });

        it('should return false if pattern does not match', function () {
            expect(critr.test({ name: 'bob' }, { name: {$regex: 'fr.+d' }})).to.be.false;
        });

        it('should return true if pattern is RegExp instance and matches', function () {
            expect(critr.test({ name: 'bob' }, { name: {$regex: /b.+b/ }})).to.be.true;
        });
    });

    describe('$where', function () {
        it('should pass the where handler the value', function () {
            expect(critr.test({ name: 'bob' }, { name: { $where: function (v) {
                return 'bob' === v;
            }}})).to.be.true;
        });

        it('should return true if function returns true', function () {
            expect(critr.test({ name: 'bob' }, { name: { $where: function (v) {
                return true;
            }}})).to.be.true;
        });

        it('should return false if function returns false', function () {
            expect(critr.test({ name: 'bob' }, { name: { $where: function (v) {
                return false;
            }}})).to.be.false;
        });
    });
});
