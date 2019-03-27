# rehire

**Easy monkey-patching for nodejs unit tests** _(based on [rewire](https://github.com/jhnns/rewire))_

## Install

`npm i rehire`

## Use cases

### How can I test internal function in module?

_util.js_:
```js
const sum = (...args) => {
    let s = 0;
    for (let i of args) {
        s += i;
    }
    return s;
};

module.exports.printSum = (...args) => {
    console.log(sum(...args));
}
```

_test.js_:
```js
const expect = require('chai').expect;
const rehire = require('rehire');
const util = rehire('./util');

describe('sum()', () => {
    it('should calculate sum of numbers', () => {
        const sum = util.__get__('sum');
        expect(sum(1, 2, 3)).to.be.equal(6);
    });
});
```

### Can I call exported functions from imported module with _rehire_?

Yes, you can call it, like you do via _require_: `util.printSum()`.

### How can I mock _console_, _process_ & other global objects?

_test.js_:
```js
const chai = require('chai');
chai.use(require("sinon-chai"));
const expect = chai.expect;
const rehire = require('rehire');
const sinon = require('sinon');
const util = rehire('./util'); // util.js see above

describe('printSum()', () => {
    let console_;

    beforeEach(() => {
        console_ = { log: sinon.stub() };
        util.__set__({ console: console_, sum: () => 1 });
    });

    afterEach(() => {
        util.__reset__();
    });

    it('should print sum of numbers', () => {
        util.printSum();
        expect(console_.log).to.be.calledOnce;
        expect(console_.log.args[0][0]).to.be.equal(1);
    });
});
```

### How can I mock third-party imported modules?

_util.js_:
```js
const fs = require('fs');

module.exports.resetDir = path => {
    if (fs.exists(path)) {
        fs.rmdirSync(path);
    }
    fs.mkdirSync(path);
};
```

_test.js_:
```js
const chai = require('chai');
chai.use(require("sinon-chai"));
const expect = chai.expect;
const rehire = require('rehire');
const sinon = require('sinon');
const util = rehire('./util');

describe('resetDir()', () => {
    let fs;

    beforeEach(() => {
        fs = {
            exists: sinon.stub(),
            rmdirSync: sinon.stub(),
            mkdirSync: sinon.stub(),
        };
        util.__set__({ fs });
    });

    afterEach(() => {
        util.__reset__();
    });

    it('should create dir if it is absent', () => {
        util.resetDir('/path/to/dir');
        expect(fs.exists).to.be.calledOnce;
        expect(fs.rmdirSync).to.not.be.called;
        expect(fs.mkdirSync).to.be.calledOnce;
        expect(fs.mkdirSync.args[0][0]).to.be.equal('/path/to/dir');
    });

    it('should remove existing dir before create', () => {
        fs.exists.returns(true);
        util.resetDir('/path/to/dir');
        expect(fs.exists).to.be.calledOnce;
        expect(fs.rmdirSync).to.be.calledOnce;
        expect(fs.rmdirSync.args[0][0]).to.be.equal('/path/to/dir');
        expect(fs.mkdirSync).to.be.calledOnce;
    });
});
```

### How can I avoid original third-party modules import?

_test.js_:
```js
const chai = require('chai');
chai.use(require("sinon-chai"));
const expect = chai.expect;
const rehire = require('rehire');
const sinon = require('sinon');
const fs = {};
const util = rehire('./util', { fs }); // util.js see above

describe('resetDir()', () => {

    beforeEach(() => {
        fs.exists = sinon.stub();
        fs.rmdirSync = sinon.stub();
        fs.mkdirSync = sinon.stub();
    });

    it('should create dir if it is absent', () => {
        util.resetDir('/path/to/dir');
        expect(fs.exists).to.be.calledOnce;
        expect(fs.rmdirSync).to.not.be.called;
        expect(fs.mkdirSync).to.be.calledOnce;
        expect(fs.mkdirSync.args[0][0]).to.be.equal('/path/to/dir');
    });

    it('should remove existing dir before create', () => {
        fs.exists.returns(true);
        util.resetDir('/path/to/dir');
        expect(fs.exists).to.be.calledOnce;
        expect(fs.rmdirSync).to.be.calledOnce;
        expect(fs.rmdirSync.args[0][0]).to.be.equal('/path/to/dir');
        expect(fs.mkdirSync).to.be.calledOnce;
    });
});
```

### Should I import _rehire_ in each tests module?

Not necessary, you can make it as global object: `require('rehire').global();`.

## API

### rehire(filepath: String): rehiredModule

Imports module.

args:
- `filepath` - Path to module (relative or absolute).

return:
- Rehired module captured by filepath. Use `rehire()` like `require()`.

### rehire(filepath: String, fakeImports: Object): rehiredModule

Imports module.

args:
- `filepath` - Path to module (relative or absolute).
- `fakeImports` - Object with fake modules which will be loaded in rehired module instead of original.
Takes keys of object as fake module names and sets its values as fake modules respectively.

return:
- Rehired module captured by filepath. Use `rehire()` like `require()`.

### rehire.global()

Makes `rehire` as available globally function.

### rehiredModule.__set__(name: String, value: Any): Function

Sets mock for module's internal entity (variable/module/function).

args:
- `name` - Name of entity to mock.
- `value` - Mocked value of entity.

return:
- Function to reset mock.

### rehiredModule.__set__(obj: Object): Function

Sets mocks for module's internal entities (variables/modules/functions).

args:
- `obj` - Object with mocked entities. Takes keys of object as entity names and sets the values respectively.

return:
- Function to reset mocks.

### rehiredModule.__reset__()

Resets all mocks which had set.

### rehiredModule.__get__(name: String): Any

Retrieves internal entity from module.

args:
- `name` - Name of internal entity.

return:
- Entity value.

### rewiredModule.__with__(obj: Object): Function<callback: Function>

Returns a function which - when being called - sets `obj`, executes the given `callback` and reverts `obj`.
If `callback` returns a promise, `obj` is only reverted after the promise has been resolved or rejected.
For your convenience the returned function passes the received promise through.

## Overview

**rehire** is based on [rewire](https://github.com/jhnns/rewire) and extends it with some useful features:

- method `global` in case if you want to use it in global context and not import in each tests file. I found issue, that if to make vanilla `rewire` as global then it detects relative paths wrongly. It's fixed with `rehire`:

     ```javascript
     const rehire = require("rehire");
     // or
     require("rehire").global();

     rehire("../my-mod");
     ```

- method `__reset__` to reset all mocked objects. You don't need to restore each mock after each test, with `rehire` it can be done with one function call:

    ```javascript
    const my_mod = rehire("../../my-mod");

    describe("my scope", () => {
        afterEach(() => {
            my_mod.__reset__();
        });

        it("test1", () => {
            my_mod.__set__("func", () => {});
            do_test();
        });

        it("test2", () => {
            my_mod.__set__("MY_CONST", 42);
            do_test();
        });
    });
    ```

- second argument to pass patched third-party modules in order to load them instead of original ones in tested module and provide full isolation for unit testing. I like this feature in [proxyquire](https://github.com/thlorenz/proxyquire):

    ```javascript
    // in tested module
    const fs = require("fs");
    const some_module = require("../third-party-module");

    // in tests
    const my_mod = rehire("../../my-mod", {
        "fs": { rmdir: () => {} },
        "../third-party-module": {},
    });
    ```
