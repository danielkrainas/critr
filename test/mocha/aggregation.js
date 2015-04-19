var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Aggregation:', function () {
    var data;

    describe('$limit', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should truncate data to length no greater than specified', function () {
            var result = critr.aggregate(data, [
                {
                    $limit: 1
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[0]);
        });
    });

    describe('$skip', function () {

        beforeEach(function () {
            data = [
                { name: 'bob' },
                { name: 'fred' }
            ];
        });

        it('should skip specified number of elements', function () {
            var result = critr.aggregate(data, [
                {
                    $skip: 1
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[1]);
        });
    });

    describe('$match', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', age: 32 },
                { name: 'fred', age: 12 }
            ];
        });

        it('should only return elements that match expression', function () {
            var result = critr.aggregate(data, [
                {
                    $match: { age: { $gt: 15 } }
                }
            ]);

            expect(result).to.have.length(1);
            expect(result[0]).to.equal(data[0]);
        });
    });

    describe('$unwind', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', kids: ['pete', 'tim'] }
            ];
        });

        it('should return multiple results with target value replaced with singular array elements', function () {
            var result = critr.aggregate(data, [
                {
                    $unwind: '$kids'
                }
            ]);

            expect(result).to.have.length(2);
            expect(result[0]).to.have.property('kids', 'pete');
            expect(result[1]).to.have.property('kids', 'tim');
        });
    });

    describe('$project', function () {

        beforeEach(function () {
            data = [
                { name: 'bob', age: 23 },
                { name: 'fred', age: 32 }
            ];
        });

        it('should include fields that have a value of true', function () {
            var result = critr.aggregate(data, [
                {
                    $project: {
                        name: true
                    }
                }
            ]);

            expect(result).to.have.length(2);
            expect(result[0]).to.not.have.property('age');
            expect(result[0]).to.have.property('name', 'bob');
        });

        it('should include fields that have a value of 1', function () {
            var result = critr.aggregate(data, [
                {
                    $project: {
                        name: 1
                    }
                }
            ]);

            expect(result).to.have.length(2);
            expect(result[0]).to.not.have.property('age');
            expect(result[0]).to.have.property('name', 'bob');
        });

        it('should include fields that have a field expression string', function () {
            var result = critr.aggregate(data, [
                {
                    $project: {
                        newName: '$name'
                    }
                }
            ]);

            expect(result).to.have.length(2);
            expect(result[0]).to.not.have.property('name');
            expect(result[0]).to.not.have.property('age');
            expect(result[0]).to.have.property('newName', data[0].name);
        });

        it('should include fields that have an expression object', function () {
            var result = critr.aggregate(data, [
                {
                    $project: {
                        name: {
                            $literal: 'sam'
                        }
                    }
                }
            ]);

            expect(result).to.have.length(2);
            expect(result[0]).to.have.property('name', 'sam');
        });
    });
});
