# Noop Console

JavaScript [nop][wiki] console, replace console method calls with no-operations.

Useful to silence all logging- i.e. during testing- or just from one module.

## Getting Started

Install the module with: `npm install noop-console`

## Examples
Mute global `console`:

```js
require('noop-console')(console);
```

Later if you want to restore the console, you can restore it by calling:

```js
console._restore();
```

If you create abstract modules with a `logger` property that references the standard console so that the actual logger implementation is defined outside the module, you can override this with a `noop-console`.

`module.js`:
```js
function MyModule(){}
MyModule.prototype.logger = console;
```

`my_test.js`:
```javascript
var MyModule = require('./module');
MyModule.prototype.logger = require('noop-console')();
```

## Release History

* 2019-01-11 v.0.5.0: Small refactoring and clean up.
* 2016-11-24 v.0.4.0: Added `_restore`.
* 2016-11-23 v.0.3.0: Take in `console` reference to mute.
* 2016-09-02 v.0.1.0: Initial release.

## License
Copyright (c) 2016 goliatone  
Licensed under the MIT license.


[wiki]: https://en.wikipedia.org/wiki/NOP
