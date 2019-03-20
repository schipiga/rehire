"use strict";

const Module = require("module");
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

    if (filename.startsWith(".")) {
        const callerPath = getCallerPath();
        const callerDir = callerPath ? path.dirname(callerPath) : process.cwd();
        filename = path.resolve(callerDir, filename);
    }

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

const load = Module._load

const patchDeps = deps => {
    for (const [k, v] of Object.entries(deps)) {
        Module._cache[require.resolve(k)] = v;
    }

    Module._load = function (request) {
        const key = require.resolve(request);
        if (key in Module._cache) {
            return Module._cache[key];
        }
        return load.apply(this, arguments);
    }
};

const restoreDeps = deps => {
    Module._load = load;
    for (const k of Object.keys(deps)) {
        delete Module._cache[require.resolve(k)];
    }
};

const rehire_ = (filename, deps) => {
    deps = deps || {};
    patchDeps(deps);
    try {
        return rewire_(filename);
    } finally {
        restoreDeps(deps);
    }
};

rehire_.global = () => {
    global.rehire = rehire_;
};

module.exports = rehire_;
