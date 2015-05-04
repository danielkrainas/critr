var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Custom Ops:', function () {
    describe('register op', function () {
        beforeEach(function () {
            critr = new critr.Critr();
        });

        it('should allow custom op registration', function () {
            expect(critr.operator('$test', function () {
                return true;
            })).to.be.true;
        });

        it('should allow op to override existing', function () {
            critr.operator('$test', function () {
                return true;
            });

            expect(critr.operator('$test', function () {
                return false;
            }, true)).to.be.true;

            expect(critr.test({ x: 1 }, { x: { $test: 0 }})).to.be.false;
        });

        it('should not override existing op by default', function () {
            critr.operator('$test', function () {
                return true;
            });

            expect(critr.operator('$test', function () {
                return false;
            })).to.be.false;

            expect(critr.test({ x: 1 }, { x: { $test: 0 }})).to.be.true;
        });
    });
});
