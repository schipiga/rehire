"use strict";

const rehire = global.rehire("../../");

suite("index", () => {

    afterChunk(() => {
        rehire.__reset__();
    });

    test("rehire()", () => {
        let normalizeDependencies, rewire_, resetDependencies;

        beforeChunk(() => {
            rehire.__set__("normalizeModulePath", sinon.stub().returns("path"));
            normalizeDependencies = sinon.stub();
            rehire.__set__("normalizeDependencies", normalizeDependencies);
            rehire.__set__("patchDependencies", sinon.stub());
            rewire_ = sinon.stub();
            rehire.__set__("rewire_", rewire_);
            resetDependencies = sinon.stub();
            rehire.__set__("resetDependencies", resetDependencies);
        });

        chunk("works ok", () => {
            rehire("./test", { "fs": {} });
            expect(normalizeDependencies).to.be.calledOnce;
            expect(normalizeDependencies.args[0][0]).to.be.eql({ "fs": {} });
            expect(rewire_).to.be.calledOnce;
            expect(resetDependencies).to.be.calledOnce;
        });
        
        chunk("sets default empty deps if no deps provided", () => {
            rehire("./test");
            expect(normalizeDependencies.args[0][0]).to.be.eql({});
        });

        chunk("reset deps if import raises exception", () => {
            rewire_.throws();
            expect(() => rehire("./test")).to.throw();
            expect(resetDependencies).to.be.calledOnce;
        });
    });

    test("rehire.global()", () => {
        let glaceRehire;

        beforeChunk(() => {
            glaceRehire = global.rehire;
        });

        afterChunk(() => {
            global.rehire = glaceRehire;
        });

        chunk("sets itself globally", () => {
            delete global.rehire;
            rehire.global();
            expect(global.rehire).to.be.equal(rehire);
        });
    });

    test("normalizeModulePath()", () => {
        let normalizeModulePath, getCallerPath, resolve;

        beforeChunk(() => {
            normalizeModulePath = rehire.__get__("normalizeModulePath");
            getCallerPath = sinon.stub();
            rehire.__set__("getCallerPath", getCallerPath);
            resolve = sinon.spy(o => o);
            rehire.__set__("require", { resolve });
        });

        [
            "/usr/node_modules/glace-core",
            "glace-core",
        ].forEach(filename => {
            chunk(`does nothing for ${filename}`, () => {
                expect(normalizeModulePath(filename)).to.be.equal(filename);
                expect(getCallerPath).to.not.be.called;
            });
        });

        chunk("uses path of module", () => {
            getCallerPath.returns("/usr/module.js");
            expect(normalizeModulePath("./test")).to.be.equal("/usr/test");
            expect(resolve).to.be.calledOnce;
        });

        chunk("uses cwd if repl", () => {
            rehire.__set__("process", { cwd: () => "/cwd" });
            expect(normalizeModulePath("./test")).to.be.equal("/cwd/test");
            expect(resolve).to.be.calledOnce;
        });
    });

    test("normalizeDepPath()", () => {
        let normalizeDepPath;

        beforeChunk(() => {
            normalizeDepPath = rehire.__get__("normalizeDepPath");
            rehire.__set__("require", { resolve: o => o });
        });

        chunk("processes absolute path", () => {
            expect(normalizeDepPath("fs", "/usr")).to.be.equal("fs");
        });

        chunk("processes relative path", () => {
            expect(normalizeDepPath("./test", "/usr")).to.be.equal("/usr/test");
        });
    });

    test("normalizeDependencies()", () => {
        let normalizeDependencies;

        beforeChunk(() => {
            normalizeDependencies = rehire.__get__("normalizeDependencies");
            rehire.__set__("require", { resolve: o => o });
        });

        chunk(() => {
            expect(normalizeDependencies({ "./fs": { a: 1 }}, "/usr"))
                .to.be.eql({ "/usr/fs": { exports: { a: 1 }}});
        });
    });

    test("patchDependencies()", () => {
        let patchDependencies, cache;

        beforeChunk(() => {
            patchDependencies = rehire.__get__("patchDependencies");
            cache = {};
            rehire.__set__("require", { cache });
        });

        chunk("sets custom dependencies to cache", () => {
            patchDependencies({ a: 1 });
            expect(cache).to.be.eql({ a: 1 });
            expect(rehire.__get__("originalDependencies")).to.be.eql({});
        });

        chunk("replaces original dependencies with custom", () => {
            cache["a"] = 2;
            patchDependencies({ a: 1 });
            expect(cache).to.be.eql({ a: 1 });
            expect(rehire.__get__("originalDependencies")).to.be.eql({ a: 2 });
        });
    });

    test("resetDependencies()", () => {
        let resetDependencies, cache;

        beforeChunk(() => {
            resetDependencies = rehire.__get__("resetDependencies");
            rehire.__set__("originalDependencies", {});
            cache = { a: 1, b: 2 };
            rehire.__set__("require", { cache });
        });

        chunk("deletes custom dependencies", () => {
            resetDependencies({ a: 1 });
            expect(cache).to.be.eql({ b: 2 });
            expect(rehire.__get__("originalDependencies")).to.be.eql({});
        });

        chunk("replaces custom dependencies with original", () => {
            rehire.__set__("originalDependencies", { a: 2 });
            resetDependencies({ a: 1 });
            expect(cache).to.be.eql({ a: 2, b: 2 });
            expect(rehire.__get__("originalDependencies")).to.be.eql({});
        });
    });

    test("getCallerPath()", () => {
        let getCallerPath;

        beforeChunk(() => {
            getCallerPath = rehire.__get__("getCallerPath");
        });

        chunk(() => {
            expect(getCallerPath()).to.be.a("string");
        });
    });

    test("rewire_()", () => {
        let rewire_, mod, error, help;

        beforeChunk(() => {
            rewire_ = rehire.__get__("rewire_");
            mod = rewire_("glace-core");
            error = mod.__get__("error");
            help = mod.__get__("help");
        });

        chunk("__set__/__get__/__reset__", () => {
            mod.__set__("error", "error");
            expect(mod.__get__("error")).to.be.equal("error");

            mod.__reset__();
            expect(mod.__get__("error")).to.be.equal(error);

            mod.__set__({ error: "error", help: "help" });
            expect(mod.__get__("error")).to.be.equal("error");
            expect(mod.__get__("help")).to.be.equal("help");

            mod.__reset__();
            expect(mod.__get__("error")).to.be.equal(error);
            expect(mod.__get__("help")).to.be.equal(help);
        });

        chunk("__set__ rewire compatibility", () => {
            const reset = mod.__set__({ error: "error", help: "help" });
            expect(mod.__get__("error")).to.be.equal("error");
            expect(mod.__get__("help")).to.be.equal("help");

            reset();
            expect(mod.__get__("error")).to.be.equal(error);
            expect(mod.__get__("help")).to.be.equal(help);

            mod.__reset__();
            expect(mod.__get__("error")).to.be.equal(error);
            expect(mod.__get__("help")).to.be.equal(help);
        });
    });
});
