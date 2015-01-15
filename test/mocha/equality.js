var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Equality:', function () {

    describe('implicit', function () {
        it('should allow implicit string comparison', function () {
            expect(critr.test({ name: 'bob' }, { name: 'bob' })).to.be.true;
        });

        it('should allow implicit number comparison', function () {
            expect(critr.test({ age: 5 }, { age: 5 })).to.be.true;
        });
    });

    describe('$eq', function () {
        it('should return true if found', function () {
            expect(critr.test({ name: 'bob' }, { name: { $eq: 'bob' }})).to.be.true;
        });

        it('should return false if not found', function () {
            expect(critr.test({ name: 'fred' }, { name: { $eq: 'bob' }})).to.be.false;
        });
    });

    describe('$ne', function () {
        it('should return false if found', function () {
            expect(critr.test({ name: 'bob' }, { name: { $ne: 'bob' }})).to.be.false;
        });

        it('should return true if not found', function () {
            expect(critr.test({ name: 'fred' }, { name: { $ne: 'bob' }})).to.be.true;
        });
    });
    
    describe('$lt', function () {
        it('should return true if value is lesser', function () {
            expect(critr.test({ age: 5 }, { age: { $lt: 6 }})).to.be.true;
        });

        it('should return false if value is equal', function () {
            expect(critr.test({ age: 5 }, { age: { $lt: 5 }})).to.be.false;
        });

        it('should return false if value is greater', function () {
            expect(critr.test({ age: 5 }, { age: { $lt: 4 }})).to.be.false;
        });
    });

    describe('$lte', function () {
        it('should return true if value is lesser', function () {
            expect(critr.test({ age: 5 }, { age: { $lte: 6 }})).to.be.true;
        });

        it('should return true if value is equal', function () {
            expect(critr.test({ age: 5 }, { age: { $lte: 5 }})).to.be.true;
        });

        it('should return false if value is greater', function () {
            expect(critr.test({ age: 5 }, { age: { $lte: 4 }})).to.be.false;
        });
    });

    describe('$gt', function () {
        it('should return false if value is lesser', function () {
            expect(critr.test({ age: 5 }, { age: { $gt: 6 }})).to.be.false;
        });

        it('should return false if value is equal', function () {
            expect(critr.test({ age: 5 }, { age: { $gt: 5 }})).to.be.false;
        });

        it('should return true if value is greater', function () {
            expect(critr.test({ age: 5 }, { age: { $gt: 4 }})).to.be.true;
        });
    });

    describe('$gte', function () {
        it('should return true if false is lesser', function () {
            expect(critr.test({ age: 5 }, { age: { $gte: 6 }})).to.be.false;
        });

        it('should return true if value is equal', function () {
            expect(critr.test({ age: 5 }, { age: { $gte: 5 }})).to.be.true;
        });

        it('should return true if value is greater', function () {
            expect(critr.test({ age: 5 }, { age: { $gte: 4 }})).to.be.true;
        });
    });

    describe('$in', function () {
        it('should return true if value found', function () {
            expect(critr.test({ color: 'green' }, { 
                color: { $in: ['green', 'purple', 'blue']}
            })).to.be.true;
        });

        it('should return false if value not found', function () {
            expect(critr.test({ color: 'orange' }, { 
                color: { $in: ['green', 'purple', 'blue']}
            })).to.be.false;
        });
    });

    describe('$nin', function () {
        it('should return true if value not found', function () {
            expect(critr.test({ color: 'pink' }, { 
                color: { $nin: ['green', 'purple', 'blue']}
            })).to.be.true;
        });

        it('should return false if value found', function () {
            expect(critr.test({ color: 'green' }, { 
                color: { $nin: ['green', 'purple', 'blue']}
            })).to.be.false;
        });
    });
});
