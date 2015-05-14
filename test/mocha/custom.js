var chai = require('chai');
var expect = chai.expect;
var critr = require('../../lib/critr');
var data = null;

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

    describe('register stage op', function () {
        beforeEach(function () {
            critr = new critr.Critr();
            data = [{
                name: 'john'
            }];
        });

        it('should allow custom stage op registration', function () {
            expect(critr.stage('$test', function (context) {
                context.output(context.data[0]);
            })).to.be.true;
        });

        it('should allow use of custom stage op', function (done) {
            critr.stage('$test', function (context, next) {
                context.output(context.param);
                next();
            });

            critr.pipe(data, [{
                $test: { name: 'bob' }
            }], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.have.property('name', 'bob');
                done();
            });
        });
    });
});
