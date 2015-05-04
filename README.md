#Critr

[![Quality](https://codeclimate.com/github/danielkrainas/critr/badges/gpa.svg)](https://codeclimate.com/github/danielkrainas/critr)

A NodeJS/browser compatible criteria evaluation library utilizing a flexible and extensible MongoDB-like query syntax.

## Installation

Critr can be installed via **npm**:

	$ npm install critr

using **bower**:

	$ bower install critr

or by downloading scripts directly from the project's **dist** folder:

- unminified: `dist/critr.js`
- minified: `dist/critr.min.js`
- source map: `dist/critr.min.js.map`

## Simple Usage

### NodeJS:

```js
var critr = require('critr');

var result = critr.test({ name: 'bob', age: 21 }, { age: { $gte: 21 }});
if (result) {
	// document met the criteria specified...
} else {
	// document failed to meet the criteria's requirements.
}
```

### Browser:

```js
// API accessed via the "Critr" global.
var result = Critr.test({ name: 'bob', age: 21 }, { age: { $gte: 21 }});

if (result) {
	// document met the criteria specified...
} else {
	// document failed to meet the criteria's requirements.
}
```

## API 

#### `bool test(object doc, object criteria)`

Evaluates `doc` to see if matches all the requirements specified by `criteria` and returns the `true` if it's a match, otherwise `false`. An `Error` is thrown if an operator is encountered that has not been registered with `registerOp` or `registerValueOp`.

**Note:** fields within the `criteria` object may be specified as a literal or a period-delimited path string like `'foo.x'` for `{ foo: { x: '' }}`.

##### NodeJS:

```js
var critr = require('critr');

var result = critr.test({ name: 'bob', age: 21 }, { age: { $gte: 21 }});
if (result) {
	// document met the criteria specified...
} else {
	// document failed to meet the criteria's requirements.
}
```

##### Browser:

```js
var result = Critr.test({ name: 'bob', age: 21 }, { age: { $gte: 21 }});

if (result) {
	// document met the criteria specified...
} else {
	// document failed to meet the criteria's requirements.
}
```

---

#### `void registerDefaults()`

Register all built-in operators.

**Note:** The operators are registered using `registerOp` with the `overwrite` option set to **true**. Any previously-registered operators with a key matching any built-in operator will be overridden.  

---

#### `bool registerOp(string key, function handler[, bool overwrite = false])`

Register a custom operator that matches ('$' + `key`) and executes `handler`. The `overwrite` flag, false by default, allows you to override any previously registered operator with the same key. The return value indicates if the operator was registered successfully.

The handler signature is `bool function(value, document, criteria)` where `value` is the right-hand expression of the operator property, `document` is the currently-scoped `document` object or value passed to `test`, and `criteria` is the currently-scoped criteria object passed to `test`.

**Note:** All keys are prepended with '$' internally so registering a key of `operator` will match `$operator` when used with `test`.

**Note:** All registered operators(value and evaluated operators) are tracked in the same lookup map and, as such, a value operator of `foo` will collide with a `foo` operator registered with `registerOp`.

##### NodeJS:

```js
var critr = require('critr');

var success = critr.registerOp('foo', function (value, doc, criteria) {
	return value;
});

var result = critr.test({ name: 'bob', age: 21 }, { age: { $foo: true }});
```

##### Browser:

```js
var success = Critr.registerOp('foo', function (value, doc, criteria) {
	return value;
});

var result = Critr.test({ name: 'bob', age: 21 }, { age: { $foo: true }});
```

---

#### `bool registerValueOp(string key[, bool overwrite])`

Register an operator that is itself not evaluated but meant to be used by another operator, such as the built-in `$options` operator. The operator and its value will be skipped/ignored by `test` when it is encountered. The `overwrite` flag, false by default, allows you to override any previously registered operator with the same key. The return value indicates if the operator was registered successfully.

**Note:** All keys are prepended with '$' internally so registering a key of `operator` will match `$operator` when used with `test`.

**Note:** All registered operators(value and evaluated operators) are tracked in the same lookup map and, as such, a value operator of `foo` will collide with a `foo` operator registered with `registerOp`.

##### NodeJS:

```js
var critr = require('critr');

var success = critr.registerValueOp('fooOptions');

var result = critr.test({ name: 'bob', age: 21 }, { $fooOptions: {}, age: { $eq: 21 }});
```

##### Browser:

```js
var success = Critr.registerValueOp('fooOptions');

var result = Critr.test({ name: 'bob', age: 21 }, { $fooOptions: {}, age: { $eq: 21 }});
```

---

#### `void clearRegistration()`

Removes **all** registered operators including built-in operators. Use `registerDefaults` if you would like to re-register the built-in operators afterwards or `resetOps` to remove only non-built-in operators. 

##### NodeJS:

```js
var critr = require('critr');

critr.clearRegistration();

// This will throw an error because the operator $eq is not registered
critr.test({ name: 'bob', age: 21 }, { age: { $eq true }});
```

##### Browser:

```js
Critr.clearRegistration();

// This will throw an error because the operator $eq is not registered
Critr.test({ name: 'bob', age: 21 }, { age: { $eq: true }});
```

---

#### `void resetOps()`

Removes all previously registered operators and re-registers the built-in ones.  

##### NodeJS:

```js
var critr = require('critr');

critr.registerValueOp('fooOptions');

critr.resetOps();

// This will throw an error because the operator $fooOptions is no longer registered
critr.test({ name: 'bob', age: 21 }, { $fooOptions: {}, age: { $eq: 21 }});
```

##### Browser:

```js
Critr.registerValueOp('fooOptions');

Critr.resetOps();

// This will throw an error because the operator $fooOptions is no longer registered
Critr.test({ name: 'bob', age: 21 }, { $fooOptions: {}, age: { $eq: 21 }});
```

## Built-in Operators

Critr comes with many built-in operators already registered, allowing it to be utilized without any pre-configuration. To remove the built-in operators and reset Critr to a "clean" state, see the `clearRegistration` function.

Many of the operators are the same as those provided by the query-syntax of MongoDB.

### Logical

- **and** - all expressions 
	-  usage: `{ $and: [/* one or more expressions... */]}`
-  **or** - any expression
	-  usage: `{ $or: [/* one or more expressions... */]}`
-  **nor** - no expressions
	-  usage: `{ $nor: [/* one or more expressions... */]}`

### Equality

- **eq** - is equal to value.
	- usage: `{ $eq: /* value expression */}`
	- please note that implicit equality checking is supported by specifying a key/value pair: `{ field: value }`
- **ne** - is not equal to value.
	- usage: `{ $ne: /* value expression */}`
- **gt** - greater than value.
	- usage: `{ $gt: /* numeric value */}`
- **gte** - greater than or equal to value.
	- usage: `{ $gte: /* numeric value */}`
- **lt** - less than value.
	- usage: `{ $lt: /* numeric value */}`
- **lte** - less than or equal to value.
	- usage: `{ $lte: /* numeric value */}`
- **in** - value or value's elements equal to one of the elements.
	- usage: `{ $in: [/* values */]}`
- **nin** - none of the value or value's elements equal to any of the elements.
	- usage: `{ $nin: [/* values */]}`

### Element

- **exists** - field exists (or does not exist) in the value.
	- usage: `{ field: { $exists: false|true }}`
- **type** - field value type is equal to type specified.
	- usage: `{ field: { $type: 'number|string|...' }}`

### Evaluation

- **mod** - modulus division using divisor and having specified remainder.
	- usage: `{ field: { $mod: [divisor, remainder] }}`
- **regexp** - value matches regular expression and allows for options using `$options` value operator.
	- usage: `{ field: { $regexp: /* regular expression string or RegExp instance */, $options: 'i' }}`
- **where** - executes a handler function to test value.
	- usage: `{ field: { $where: function (value) { return true|false; }}}`

### Arrays

- **size** - matches array value's length.
	- usage: `{ field: { $size: /* number */ }}`
- **elemMatch** - at least one array value matches.
	- usage: `{ field: { $elemMatch: /* object with criteria */ }}`
- **all** - all values are in the field's value.
	- usage: `{ field: { $all: [/* values */]}}`

## Bugs and Feedback

If you see a bug or have a suggestion, feel free to open an issue [here](https://github.com/danielkrainas/critr/issues).

## Contributions

PR's welcome! There are no strict style guidelines, just follow best practices and try to keep with the general look & feel of the code present. All submissions must pass jslint and have a test to verify *(if applicable)*.

## License

[MIT License](http://opensource.org/licenses/MIT). Copyright 2015 Daniel Krainas [http://www.danielkrainas.com](http://www.danielkrainas.com)
