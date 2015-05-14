var chai = require('chai');
var expect = chai.expect;
var critr = require('../../lib/critr');

describe('Fields:', function () {
    describe('$exists', function () {
        it('should return true if field exists and searching for existing field', function () {
            expect(critr.test({ name: 'bob' }, {
                name: { $exists: true }
            })).to.be.true;
        });

        it('should return false if field doesnt exist and searching for existing field', function () {
            expect(critr.test({ age: 5 }, {
                name: { $exists: true }
            })).to.be.false;
        });

        it('should return false if field exists and searching for nonexistent field', function () {
            expect(critr.test({ name: 'bob' }, {
                name: { $exists: false }
            })).to.be.false;
        });

        it('should return true if field doesnt exist and searching for nonexistent field', function () {
            expect(critr.test({ age: 5 }, {
                name: { $exists: false }
            })).to.be.true;
        });
    });

    describe('$type', function () {
        it('should return true if field is same type', function () {
            expect(critr.test({ age: 5 }, {
                age: { $type: 'number' }
            })).to.be.true;
        });

        it('should return false if field is not same type', function () {
            expect(critr.test({ age: 5 }, {
                age: { $type: 'string' }
            })).to.be.false;
        });
    });
});
