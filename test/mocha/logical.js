var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Logical:', function () {

    describe('$and', function () {
        it('should return true if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $and: [
                    {name: { $eq: 'bob'}}, 
                    {age: {$eq: 5}}
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $and: [
                    {name: { $eq: 'bob'}}, 
                    {age: { $eq: 6 }}
                ]
            })).to.be.false;
        });
    });

    describe('$or', function () {
        it('should return true if any expression is true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $or: [
                    {name: { $eq: 'bob'}}, 
                    {age: {$eq: 4}}
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are false', function () {
            expect(critr.test({ name: 'fred', age: 5 }, { 
                $or: [
                    {name: { $eq: 'bob'}}, 
                    {age: { $eq: 6 }}
                ]
            })).to.be.false;
        });

        it('should return true if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $or: [
                    {name: { $eq: 'bob'}}, 
                    {age: { $eq: 5 }}
                ]
            })).to.be.true;
        });
    });

    describe('$nor', function () {
        it('should return false if any expression is false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, { 
                $nor: [
                    {name: { $eq: 'fred'}},
                    {age: {$eq: 5}}
                ]
            })).to.be.false;
        });

        it('should return true if all expressions are false', function () {
            expect(critr.test({ name: 'fred', age: 5 }, { 
                $nor: [
                    {name: { $eq: 'bob'}},
                    {age: { $eq: 6 }}
                ]
            })).to.be.true;
        });

        it('should return false if all expressions are true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $nor: [
                    {name: { $eq: 'bob'}},
                    {age: { $eq: 5 }}
                ]
            })).to.be.false;
        });
    });

    describe('$not', function () {
        it('should return false if expression is true', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $not: {
                    age: { $eq: 5 }
                }
            })).to.be.false;
        });

        it('should return true if expression is false', function () {
            expect(critr.test({ name: 'bob', age: 5 }, {
                $not: {
                    age: { $eq: 4 }
                }
            })).to.be.true;
        });
    });
});
