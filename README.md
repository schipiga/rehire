rehire
======

**Easy monkey-patching for nodejs unit tests**

**rehire** is based on [rewire](https://github.com/jhnns/rewire) and extends it with some useful features:

- method `global` in case if you want use it in global context and not import in each tests file. I found issue, that if to make vanilla `rewire` as global then it detects relative paths wrongly. It's fixed with `rehire`:

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
    const my_mod = rehire("../../my-mod", { "fs": { rmdir: () => {} }, "../third-party-module": {} });
    ```
