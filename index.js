"use strict";

const path = require("path");

const rewire = require("rewire");

const CALLS_DEPTH = 2; // Important to keep it actual

const getCallerPath = () => {
    const _ = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _;
    return stack[CALLS_DEPTH].getFileName();
};

const rewire_ = filename => {
    const mod = rewire(filename);

    let cache = {};

    const set = mod.__set__;
    mod.__set__ = function (obj, mock) {

        if (typeof(obj) === "string") {
            obj = { [obj]: mock };
        }

        for (const name of Object.keys(obj)) {
            if (!(name in cache)) {
                cache[name] = this.__get__(name);
            }
        }
        return set.call(this, obj);
    };

    mod.__reset__ = function () {
        this.__set__(cache);
        cache = {};
    };

    return mod;
};

let originalDependencies = {};

const patchDependencies = deps => {
    for (const [k, v] of Object.entries(deps)) {
        if (k in require.cache) {
            originalDependencies[k] = require.cache[k];
        }
        require.cache[k] = v;
    }
};

const resetDependencies = deps => {
    for (let k of Object.keys(deps)) {
        if (k in originalDependencies) {
            require.cache[k] = originalDependencies[k];
        } else {
            delete require.cache[k];
        }
    }
    originalDependencies = {};
};

const normalizeDependencies = (deps, root) => {
    const result = {};
    for (const [k, v] of Object.entries(deps)) {
        result[normalizeDepPath(k, root)] = { exports: v };
    }
    return result;
};

const normalizeDepPath = (dep, root) => {
    if (dep.startsWith(".")) {
        dep = path.resolve(root, dep);
    }
    return require.resolve(dep);
};

const normalizeModulePath = filename => {
    // absolute path or global module, let's rewire resolves it
    if (!filename.startsWith(".")) {
        return filename;
    }
    // relative path should be normalized because rewire can't resolve it proper
    const callerPath = getCallerPath();
    const callerDir = callerPath ? path.dirname(callerPath) : process.cwd();
    return require.resolve(path.resolve(callerDir, filename));
};

const rehire_ = (filename, deps) => {
    deps = deps || {};

    filename = normalizeModulePath(filename);
    deps = normalizeDependencies(deps, path.dirname(filename));

    patchDependencies(deps);
    try {
        return rewire_(filename);
    } finally {
        resetDependencies(deps);
    }
};

rehire_.global = () => {
    global.rehire = rehire_;
};

module.exports = rehire_;
