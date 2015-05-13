var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Fields:', function () {
    describe('$mod', function () {
        it('should return correct remainder', function () {
            expect(critr.evaluate({}, { $mod: [5, 2] })).to.equal(1);
        });

        /*it('should return false if remainder is not the same', function () {
            expect(critr.evaluate({}, { $mod: [4, 2] })).to.equal(0);
        });*/
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

        it('should use flags in $options parameter', function () {
            expect(critr.test({ name: 'bob' }, { name: { $regex: 'B.+B', $options: 'i' }})).to.be.true;
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

    describe('$toLower', function () {
        it('should convert expression value to lowercase', function () {
            expect(critr.evaluate({ name: 'HELLO' }, { $toLower: '$name' })).to.equal('hello');
        });
    });

    describe('$toUpper', function () {
        it('should convert expression value to uppercase', function () {
            expect(critr.evaluate({ name: 'hello' }, { $toUpper: '$name' })).to.equal('HELLO');
        });
    });

    describe('$ifNull', function () {
        it('should evaluate param[1] if evaluated param[0] is null', function () {
            expect(critr.evaluate({ name: null, age: 5 }, { $ifNull: ['$name', '$age']})).to.equal(5);
        });

        it('should return evaluated param[0] if value is not null', function () {
            expect(critr.evaluate({ name: 'bob', age: 5 }, { $ifNull: ['$name', '$age']})).to.equal('bob');
        });
    });

    describe('$add', function () {
        it('should return the sum of parameter expressions', function () {
            expect(critr.evaluate({ age: 5, parentsAge: 2 }, { $add: ['$age', '$parentsAge', 2]})).to.equal(9);
        });
    });

    describe('$subtract', function () {
        it('should return the difference of parameter expressions', function () {
            expect(critr.evaluate({ age: 5, parentsAge: 2 }, { $subtract: ['$age', '$parentsAge', 2]})).to.equal(1);
        });
    });

    describe('$multiply', function () {
        it('should return the product of parameter expressions', function () {
            expect(critr.evaluate({ age: 5, parentsAge: 2 }, { $multiply: ['$age', '$parentsAge', 2]})).to.equal(20);
        });
    });

    describe('$divide', function () {
        it('should return the quotient of parameter expressions', function () {
            expect(critr.evaluate({ age: 20 }, { $divide: ['$age', 2, 5]})).to.equal(2);
        });
    });

    describe('$cond', function () {
        it('should evaluate condition and return then case if result is truthy', function () {
            expect(critr.evaluate({ age: 20 },
                {
                    $cond: {
                        if: { age: 20 },
                        then: { $literal: 2 },
                        else: { $literal: 1 }
                    }
                }
            )).to.equal(2);
        });

        it('should evaluate condition and return else case if result is falsey', function () {
            expect(critr.evaluate({ age: 20 },
                {
                    $cond: {
                        if: { age: 1 },
                        then: { $literal: 2 },
                        else: { $literal: 1 }
                    }
                }
            )).to.equal(1);
        });
    });
});
