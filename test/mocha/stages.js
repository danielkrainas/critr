var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Stages:', function () {
    var data;

    describe('$sort', function () {

        beforeEach(function () {
            data = [
                { name: 'fred', age: 4 },
                { name: 'fred', age: 8 },
                { name: 'bob', age: 19 }
            ];
        });

        it('should sort data in ascending order', function (done) {
            critr.pipe(data, [
                { $sort: { name: 1 } }
            ], function (result) {
                expect(result).to.have.length(3);
                expect(result[0]).to.equal(data[2]);
                expect(result[1]).to.equal(data[0]);
                done();
            });
        });

        it('should sort data in descending order', function (done) {
            critr.pipe(data, [
                { $sort: { name: -1 } }
            ], function (result) {
                expect(result).to.have.length(3);
                expect(result[0]).to.equal(data[0]);
                expect(result[2]).to.equal(data[2]);
                done();
            });
        });

        it('should sort data on multiple fields', function (done) {
            critr.pipe(data, [
                {
                    $sort: {
                        name: 1,
                        age: -1
                    }
                }
            ], function (result) {
                expect(result).to.have.length(3);
                expect(result[0]).to.equal(data[2]);
                expect(result[1]).to.equal(data[1]);
                done();
            });
        });
    });

    describe('$output', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should output results to specified array', function (done) {
            var snapshot = [];
            critr.pipe(data, [
                {
                    $project: {
                        newName: '$name'
                    }
                },
                {
                    $output: snapshot
                },
                {
                    $limit: 1
                }
            ], function (result) {
                expect(result).to.have.length(1);
                expect(result).to.not.equal(snapshot);
                expect(snapshot).to.have.length(2);
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
            critr.pipe(data, [
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
            critr.pipe(data, [
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
            var result = critr.pipe(data, [
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
            critr.pipe(data, [
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
            critr.pipe(data, [
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
            critr.pipe(data, [
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
            critr.pipe(data, [
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
            critr.pipe(data, [
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
