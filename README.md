# Critr [![Quality](https://codeclimate.com/github/danielkrainas/critr/badges/gpa.svg)](https://codeclimate.com/github/danielkrainas/critr) [![Build](https://img.shields.io/codeship/cb52b7f0-d81e-0132-f585-769405cfda59/master.svg)](https://codeship.com/projects/78841) [![Test Coverage](https://codeclimate.com/github/danielkrainas/critr/badges/coverage.svg)](https://codeclimate.com/github/danielkrainas/critr/coverage)

A NodeJS/browser compatible object filtering and manipulation library that uses a flexible and extensible MongoDB-like syntax.

## Installation

Critr can be installed via [npm](https://npmjs.org):

    $ npm install critr

using [bower](http://bower.io/):

    $ bower install critr

or by downloading scripts directly from the project's [dist](https://github.com/danielkrainas/critr/tree/master/dist) folder (updated every [release](https://github.com/danielkrainas/critr/releases)):

- unminified: `dist/critr.js`
- minified: `dist/critr.min.js`

## Simple Usage

### NodeJS

```js
// the module initializes an instance of Critr with all default operators
var critr = require('critr');

if (critr.test({foo: 4}, { foo: { $gt: 3 }})) {
	console.log('match!');
} else {
	console.log('failed!');
}
```

**Output:**

> match!

### Browser

```js
if (critr.test({foo: 4}, { foo: { $lt: 3 }})) {
	console.log('match!');
} else {
	console.log('failed!');
}
```

**Output:**

> failed!

## API

### Expressions

Expressions are the core of Critr and are used in almost every context of execution. An expression can be a period(`.`) delimited string representing a property path prefixed by a dollar sign(`$`), as in:
 
```js
var memberExpression = '$path.to.property';
```

Expressions may also be objects that use a mix of member expression strings and standard operators to represent a projection, as with:

```js
var projectionExpression = { id: { $add: ['$foo', '$bar'] }, name: { $literal: 'bob' }}; 
``` 

Lastly, an expression may also be a number literal.

### `object Critr([object options])`

Creates a new instance of `Critr` and applies the `options` if specified.

#### Options

- **defaults** - *(Boolean)* register default operators.
- **defaultStages** - *(Boolean)* register default stage operators.
- **defaultAccumulators** - *(Boolean)* register default accumulation operators.

### `Function critr.Critr`

A reference to the `Critr` constructor function.

### `Boolean critr.test(Object data, Expression expression)`

Evaluates an expression, `expression`, using a single object, `data`, and returns `true` if the result is a truthy value, otherwise `false`.

Although they are similar and may be used interchangeably in certain situations, the driving difference between `critr.evaluate` and `critr.test` is that `test` will always return either `true` or `false`.

### `T critr.evaluate<T>(Object data, Expression<T> expression)`

Evaluates an expression, `expression`, using a single object, `data`, and returns the result. If for any reason, an invalid or no value is returned, the result will be `null`.

### `void critr.pipe(Object data, Array[Expression] stages, Function callback)`

An asynchronous operation, similar to MongoDB's aggregation framework, that processes data through an array of stage operations and returns the result to `callback`.

The `callback` signature is `void Function(Array[T] results, Error? error)`. If an error occurs, `results` will be `null`.

### `Array[Object] critr.group(Array[Object] data, Expression expression)`

Group elements of `data` by evaluating each element against the expression in `expression._id`. Any values within `expression` may contain standard and accumulation operators *except* for the key expression, `expression._id`, which may only contain standard operators.

**Example:**

```js
var data = [
    { name: 'bob', age: 5, gender: 'male' },
    { name: 'fred', age: 7, gender: 'male' },
    { name: 'sarah', age: 22, gender: 'female' }
];

var result = critr.group(data, { _id: '$gender', count: { $sum: 1 }});

console.log(result[0]);
console.log(result[1]);
```

**Output:**

> { _id: 'male', count: 2 }
> { _id: 'female', count: 1 }

### `Integer critr.count(Array[Object] data, Expression expression)`

Tests each element of `data` using `expression` and returns the count of elements that evaluated truthy.

### `Function critr.accumulators(String key)`

Returns any registered accumulation operator handler with the specified `key`.

### `Boolean critr.accumulator(String key, Function handler, Boolean? overwrite)`

Registers an accumulation operator handler, `handler`, with the specified `key` and returns either `true` or `false` depending if registration was successful. If `overwrite` is specified and is `true`, any existing operator with the same key will be overridden; `overwrite` is `false` by default.

### `Function critr.stage(String key)`

Returns any registered stage operator handler with the specified `key`.

### `Boolean critr.stage(String key, Function handler, Boolean? overwrite)`

Registers a stage operator handler, `handler`, with the specified `key` and returns either `true` or `false` depending if registration was successful. If `overwrite` is specified and is `true`, any existing operator with the same key will be overridden; `overwrite` is `false` by default.

### `Function critr.operator(String key)`

Returns any registered standard operator handler with the specified `key`.

### `Boolean critr.operator(String key, Function handler, Boolean? overwrite)`

Registers a standard operator handler, `handler`, with the specified `key` and returns either `true` or `false` depending if registration was successful. If `overwrite` is specified and is `true`, any existing operator with the same key will be overridden; `overwrite` is `false` by default.

### `Object Critr.defaults`

An object with `accumulators`, `stages`, and `operators` properties that contain the default operators used by Critr during initialization. They may be modified though it is not advised and you should instead use the `critr.accumulator`, `critr.stage`, and `critr.operator` methods.

```js
{

	accumulators: HashMap<String, Function>,

	stages: HashMap<String, Function>,

	operators: HashMap<String, Function>
}
```

## Default Operators

### Standard

Logical:

- **$and** - A logical AND operation on an array of two or more expressions and returns true if the context satisfies all expressions in the array.
	- `{ $and: [{ <expression1> }, { <expression2> }, ... { <expressionN> } ] }`
- **$or** - Performs a logical OR operation on an array of two or more expressions and returns true if the context satisfies at least one of the expression in the array. 
	- `{ $or: [{ <expression1> }, { <expression2> }, ... { <expressionN> } ] }`
- **$nor** - Performs a logical NOR operation on an array of two or more expressions and returns true if the context *fails* to satisfy all expressions in the array.
	- `{ $nor: [{ <expression1> }, { <expression2> }, ... { <expressionN> } ] }`
- **$not** - Performs a logical NOT operation on the specified expression and returns true if the context does *not* match the expression.
	- `{ <field>: { $not: { <expression> } } }`

Equality:

- **$eq** - Returns true if field of a context equals the specified value.
	- `{ <field>: { $eq: <value> } }`
- **$ne** - Returns true if field of a context does *not* equal the specified value.
	- `{ <field>: { $ne: <value> } }`
- **$lt** - Returns true if the field value is less than the specified value.
	- `{ <field>: { $lt: <value> } }`
- **$lte** - Returns true if the field value is less than or equal to the specified value.
	- `{ <field>: { $lte: <value> } }`
- **$gt** - Returns true if the field value is greater than the specified value.
	- `{ <field>: { $gt: <value> } }`
- **$gte** - Returns true if the field value is greater than or equal to the specified value.
	- `{ <field>: { $gte: <value> } }`
- **$in** - Returns true if the field value equals any value in the specified array.
	- `{ <field>: { $in: [<value1>, <value2>, ... <valueN> ] } }`
- **$nin** - Returns true if the field value does *not* equal any value in the specified array. 
	- `{ <field>: { $nin: [<value1>, <value2>, ... <valueN> ] } }`
- **$all** - Returns true if the field value equals all values in the specified array.
	- `{ <field>: { $all: [<value1>, <value2>, ... <valueN> ] } }`
- **$regex** - Returns true if the string field value matches the specified regex condition.
	- `{ <field>: { $regex: /pattern/, $options: '<options>' } }`
	- `{ <field>: { $regex: 'pattern', $options: '<options>' } }`
	- `{ <field>: { $regex: /pattern/<options> } }` 
- **$where** - Returns true if the specified function returns true for the field value.  
	- `{ <field>: { $where: function (value) { ... } } }`

Arrays:

- **$elemMatch** - Returns true if the array field contains any element that matches the specified expression.
	- `{ <field>: { $elemMatch: { <expression> } } }`
- **$size** - Returns true if the array field has the specified number of elements.
	- `{ <field>: { $size: <value> } }` 

Evaluation:

- **$literal** - Returns the specified value without parsing.
	- `{ $literal: <value> }`
- **$ifNull** - Evaluates an expression and returns the value of the expression if the expression evaluates to a non-null value. If the field evaluates to nothing, it returns the value of the replacement expression.
	- `{ $ifNull: [ <expression>, <replacement-expression-if-null> ] }`
- **$cond** - Evaluates a boolean expression to return one of the two specified return expressions.
	- `{ $cond: { if: <boolean-expression>, then: <true-case>, else: <false-case> } }`

Strings:

- **$toLower** - Converts a string to lowercase and returns the result.
	- `{ $toLower: <expression> }`
- **$toUpper** - Converts a string to uppercase and returns the result.
	- `{ $toUpper: <expression> }`

Arithmetic:

- **$add** - Returns the result of adding all numbers in the specified array.
	- `{ $add: [ <expression1>, <expression2>, ... <expressionN> ] }`
- **$subtract** - Returns the result of subtracting all numbers in the specified array.
	- `{ $subtract: [ <expression1>, <expression2>, ... <expressionN> ] }` 
- **$multiply** - Returns the result of multiplying all numbers in the specified array.
	- `{ $multiply: [ <expression1>, <expression2>, ... <expressionN> ] }`
- **$divide** - Returns the result of dividing all numbers in the specified array.
	- `{ $divide: [ <expression1>, <expression2>, ... <expressionN> ] }`
- **$mod** - Returns the result of a modulo operation on all numbers in the specified array.
	- `{ $mod: [ <expression1> <expression2>, ... <expressionN> ] }`

Fields:

- **$exist** - Returns true where the field exists in the context, even if the value is `null`. If `<boolean>` is false, the operator will return true if the context does *not* contain the field. 
	- `{ <field>: { $exists: <boolean> } }`
- **$type** - Returns true if the field is the same as the specified type string.
	- `{ <field>: { $type: <type-name> } }`

Misc:

- **$options** - A NOOP operator that is context-specific and used to store optional arguments for other operators.
	- This is currently used by: $regex


### Accumulators

These operators are intended for use with the `critr.group` function or the `$group` pipe stage.

- **$sum** - Calculates and returns the sum of all numeric values from applying `<expression>` to each object in a group. Ignores non-numeric values.
	- `{ $sum: <expression> }` 
- **$avg** - Calculates and returns the average of all numeric values from applying `<expression>` to each object in a group. Ignores non-numeric values.
	- `{ $avg: <expression> }`
- **$first** - Returns the value that results from applying `<expression>` to the first object in a group.
	- `{ $first: <expression> }`
- **$last** - Returns the value that results from applying `<expression>` to the last object in a group.
	- `{ $last: <expression> }`
- **$max** - Returns the highest value that results from applying `<expression>` to each object in a group.
	- `{ $max: <expression> }`
- **$min** - Returns the lowest value that results from applying `<expression>` to each object in a group.
	- `{ $min: <expression> }`
- **$push** - Returns an array of *all* values that result from applying `<expression>` to each object in a group.
	- `{ $push: <expression> }`
- **$addToSet** - Returns an array of all *unique* values that result from applying `<expression>` to each object in a group.
	- `{ $addToSet: <expression> }`

### Stages

- **$group** - Groups input objects by some specified expression and outputs to the next stage an object for each distinct grouping.
	- `{ $group: { _id: <expression>, <field1>: { <accumulator1>: <expression1> }, ... } }`
- **$sort** - Sorts all input objects and outputs to the next stage in sorted order. `<order>` can be `1` for ascending or `-1` for descending.
	- `{ $sort: { <field1>: <order>, <field2>: <order>, ... <fieldN>: <order> } }`
- **$output** - Pushes the input objects into `<array>` and then outputs them to the next stage.
	- `{ $output: <array> }`
- **$limit** - Limits the number of objects passed to the next stage.
	- `{ $limit: <positive-integer> }`
- **$skip** - Skips over the specified number of objects that pass into the next stage and passes the remaining objects to the next stage.
	- `{ $skip: <positive-integer> }`
- **$match** - Filters the objects to pass only the objects that match the specified condition(s) to the next stage.
	- `{ $match: { <expression> } }`
- **$project** - Passes along the objects with only the specified fields to the next stage. The specified fields can be existing fields from the input objects or newly computed fields.
	- `{ $project: { <specifications> } }`
		- To specify an inclusion of a field: `<field>: <1 or true>`
		- To add a new field: `<field>: <expression>`
-  **$unwind** - Deconstructs an array field from the input objects to output an object for *each* element. Each output object is the input object with the value of the array field replaced by the element.
	-  `{ $unwind: <field> }`

## Bugs and Feedback

If you see a bug or have a suggestion, feel free to open an issue [here](https://github.com/danielkrainas/critr/issues).

## Contributions

PR's welcome! There are no strict style guidelines, just follow best practices and try to keep with the general look & feel of the code present. All submissions must pass jshint and have a test to verify *(if applicable)*.

## License

[Unlicense](http://unlicense.org/UNLICENSE). This is a Public Domain work. 

[![Public Domain](https://licensebuttons.net/p/mark/1.0/88x31.png)](http://questioncopyright.org/promise)

> ["Make art not law"](http://questioncopyright.org/make_art_not_law_interview) -Nina Paley

