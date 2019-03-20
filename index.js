"use strict";

const path = require("path");

const rewire = require("rewire");

const getCallerPath = () => {
    const _ = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _;
    return stack[1].getFileName();
};

const rewire_ = filename => {
    const mod = rewire(filename);

    let cache = {};

    const set = mod.__set__;
    mod.__set__ = function (name, stub) {

        if (!Object.keys(cache).includes(name)) {
            cache[name] = this.__get__(name);
        }

        set.call(this, name, stub);
    };

    mod.__reset__ = function () {
        for (const [k, v] of Object.entries(cache)) {
            this.__set__(k, v);
        }
        cache = {};
    };

    return mod;
};

const patchDeps = (deps, root) => {
    for (let [k, v] of Object.entries(deps)) {
        if (k.startsWith('.')) {
            k = path.resolve(root, k);
        }
        require.cache[k] = { exports: v };
    }
};

const restoreDeps = (deps, root) => {
    for (let k of Object.keys(deps)) {
        if (k.startsWith('.')) {
            k = path.resolve(root, k);
        }
        delete require.cache[k];
    }
};

const rehire_ = (filename, deps) => {
    deps = deps || {};

    if (filename.startsWith(".")) {
        const callerPath = getCallerPath();
        const callerDir = callerPath ? path.dirname(callerPath) : process.cwd();
        filename = path.resolve(callerDir, filename);
    }

    const root = path.dirname(filename);
    patchDeps(deps, root);
    try {
        return rewire_(filename);
    } finally {
        restoreDeps(deps, root);
    }
};

rehire_.global = () => {
    global.rehire = rehire_;
};

module.exports = rehire_;
