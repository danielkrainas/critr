var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Aggregation:', function () {
    var data;

    describe('piping', function () {
        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' },
                { name: 'john' }
            ];
        });

        it('should return result after running data through $skip and $limit operations', function (done) {
            critr.aggregate(data, [
                { $skip: 1 },
                { $limit: 1 }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.equal(data[1]);
                done();
            });
        });
    });

    describe('$limit', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should truncate data to length no greater than specified', function (done) {
            critr.aggregate(data, [
                {
                    $limit: 1
                }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.equal(data[0]);
                done();
            });
        });
    });

    describe('$skip', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should skip specified number of elements', function (done) {
            critr.aggregate(data, [
                {
                    $skip: 1
                }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.equal(data[1]);
                done();
            });
        });
    });

    describe('$match', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', age: 32 },
                { name: 'fred', age: 12 }
            ];
        });

        it('should only return elements that match expression', function (done) {
            var result = critr.aggregate(data, [
                {
                    $match: { age: { $gt: 15 } }
                }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result[0]).to.equal(data[0]);
                done();
            });
        });
    });

    describe('$unwind', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', kids: ['pete', 'tim'] }
            ];
        });

        it('should return multiple results with target value replaced with singular array elements', function (done) {
            critr.aggregate(data, [
                {
                    $unwind: '$kids'
                }
            ], function (result) {
                expect(result).to.have.length(2);
                expect(result[0]).to.have.property('kids', 'pete');
                expect(result[1]).to.have.property('kids', 'tim');
                done();
            });
        });
    });

    describe('$project', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', age: 23 },
                { name: 'fred', age: 32 }
            ];
        });

        it('should include fields that have a value of true', function (done) {
            critr.aggregate(data, [
                {
                    $project: {
                        name: true
                    }
                }
            ], function (result) {
                expect(result).to.have.length(2);
                expect(result[0]).to.not.have.property('age');
                expect(result[0]).to.have.property('name', 'bob');
                done();
            });
        });

        it('should include fields that have a value of 1', function (done) {
            critr.aggregate(data, [
                {
                    $project: {
                        name: 1
                    }
                }
            ], function (result) {
                expect(result).to.have.length(2);
                expect(result[0]).to.not.have.property('age');
                expect(result[0]).to.have.property('name', 'bob');
                done();
            });
        });

        it('should include fields that have a field expression string', function (done) {
            critr.aggregate(data, [
                {
                    $project: {
                        newName: '$name'
                    }
                }
            ], function (result) {
                expect(result).to.have.length(2);
                expect(result[0]).to.not.have.property('name');
                expect(result[0]).to.not.have.property('age');
                expect(result[0]).to.have.property('newName', data[0].name);
                done();
            });
        });

        it('should include fields that have an expression object', function (done) {
            critr.aggregate(data, [
                {
                    $project: {
                        name: {
                            $literal: 'sam'
                        }
                    }
                }
            ], function (result) {
                expect(result).to.have.length(2);
                expect(result[0]).to.have.property('name', 'sam');
                done();
            });
        });
    });
});
