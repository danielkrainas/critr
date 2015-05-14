var chai = require('chai');
var expect = chai.expect;
var critr = require('../../src/critr');

describe('Accumulators:', function () {
    var data;

    beforeEach(function () {
        data = [
            { name: 'bob', age: 5 },
            { name: 'fred', age: 3 },
            { name: 'john', age: 4 }
        ];
    });

    describe('$sum', function () {
        it('should sum values together', function () {
            var result = critr.group(data, { age: { $sum: '$age' }});
            expect(result[0]).to.have.property('age', 12);
        });
    });

    describe('$avg', function () {
        it('should return the average of all values', function () {
            var result = critr.group(data, { age: { $avg: '$age' }});
            expect(result[0]).to.have.property('age', 4);
        });
    });

    describe('$first', function () {
        it('should return the first value encountered', function () {
            var result = critr.group(data, { age: { $first: '$age' }});
            expect(result[0]).to.have.property('age', 5);
        });
    });

    describe('$last', function () {
        it('should return the last value encountered', function () {
            var result = critr.group(data, { age: { $last: '$age' }});
            expect(result[0]).to.have.property('age', 4);
        });
    });

    describe('$max', function () {
        it('should return the largest value encountered', function () {
            var result = critr.group(data, { age: { $max: '$age' }});
            expect(result[0]).to.have.property('age', 5);
        });
    });

    describe('$min', function () {
        it('should return the lowest value encountered', function () {
            var result = critr.group(data, { age: { $min: '$age' }});
            expect(result[0]).to.have.property('age', 3);
        });
    });

    describe('$push', function () {
        it('should return all values as an array', function () {
            var result = critr.group(data, { age: { $push: '$age' }});
            expect(result[0]).to.have.property('age');
            expect(result[0].age).to.contain(3)
                .and.contain(5).and.contain(4);
        });

        it('should return all duplicates', function () {
            data.push({ name: 'lenny', age: 4 });
            var result = critr.group(data, { age: { $push: '$age' }});
            expect(result[0].age).to.have.length(4);
        });
    });

    describe('$addToSet', function () {
        it('should return all values as an array', function () {
            var result = critr.group(data, { age: { $addToSet: '$age' }});
            expect(result[0]).to.have.property('age');
            expect(result[0].age).to.contain(3)
                .and.contain(5).and.contain(4);
        });

        it('should only return unique values', function () {
            data.push({ name: 'lenny', age: 4 });
            var result = critr.group(data, { age: { $addToSet: '$age' }});
            expect(result[0].age).to.have.length(3);
        });
    });
});
