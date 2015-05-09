# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Added
- This CHANGELOG file to hopefully capture any change notes
- `evaluate` method to public interface.
- CodeClimate badge to README.
- get operation with `operator` method.
- Custom stage operators using the `stage` method, similar to `operator` but for pipeline stage operators.
- `$group` stage and accumulators.
- Custom accumulator support via `accumulator` method.
- `defaultAccumulators` initialization option.
- `$toLower`, `$toUpper`, `$ifNull`, `$cond`, `$add`, `$subtract`, `$multiply`, `$divide` expression operators.
- `group` method to public interface.
- `count` method to public interface.
- `paramKeys` array property to stage context.
- `forEachParamKey` method to stage context.
- Build status shield to README

### Changed
- The public interface into a type accessible via `<instance>.Critr`
- Term *filter* to *stage* keeping closer to MongoDB's terminology.
- Operator `$literal` to be a real operator.
- Operator context property `criteria` changed to `expression`
- `evaluate` to support general operators.
- `registerOps` to `operator`.
- Operator registration no longer prepends '$' to names.
- `aggregate` method to `pipe` for an easier to type name.
- Operator context property `value` to `param`
- Licensing terms and details. Critr is now dedicated to the public domain. See [UNLICENSE][unlicense].

### Removed
- `resetOps` for now. Create new instance of type for a clean state.
- `clearRegistration` for now. Create new instance of type for a clean state.
- `registerDefaults`. Create new instance of type with `defaults` and `defaultFilters` true.
- `registerValueOp`. Simply create your own operator with a noop handler for these instances.
- `evaluateFieldExpression`. Use `evaluate` for this operation now.


[unreleased]: https://github.com/danielkrainas/critr/compare/v0.1.0...HEAD

[unlicense]: https://github.com/danielkrainas/critr/blob/master/UNLICENSE