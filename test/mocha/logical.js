var chai = require('chai');
var expect = chai.expect;
var critr = require('../../lib/critr');

describe('Logical:', function () {

    describe('$and', function () {
        it('should return true if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $and: [
                    { name: 'bob' },
                    { age: 5 }
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $and: [
                    { name: 'bob' }, 
                    { age: 6 }
                ]
            })).to.be.false;
        });
    });

    describe('$or', function () {
        it('should return true if any expression is true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $or: [
                    { name: 'bob' },
                    { age: 4 }
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are false', function () {
            expect(critr.test({ name: 'fred', age: 5 }, { 
                $or: [
                    { name: 'bob' },
                    { age: 6 }
                ]
            })).to.be.false;
        });

        it('should return true if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $or: [
                    { name: 'bob' },
                    { age: 5 }
                ]
            })).to.be.true;
        });
    });

    describe('$nor', function () {
        it('should return false if any expression is false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $nor: [
                    { name: 'fred' },
                    { age: 5 }
                ]
            })).to.be.false;
        });

        it('should return true if all expressions are false', function () {
            expect(critr.test({ name: 'fred', age: 5 }, { 
                $nor: [
                    { name: 'bob' },
                    { age: 6 }
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $nor: [
                    { name: 'bob' },
                    { age: 5 }
                ]
            })).to.be.false;
        });
    });

    describe('$not', function () {
        it('should return false if expression is true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $not: {
                    age: 5
                }
            })).to.be.false;
        });

        it('should return true if expression is false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $not: {
                    age: 4
                }
            })).to.be.true;
        });
    });
});
