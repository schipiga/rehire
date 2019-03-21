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
        let normalizeModulePath, getCallerPath;

        beforeChunk(() => {
            normalizeModulePath = rehire.__get__("normalizeModulePath");
            getCallerPath = sinon.stub();
            rehire.__set__("getCallerPath", getCallerPath);
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
        });

        chunk("uses cwd if repl", () => {
            rehire.__set__("process", { cwd: () => "/cwd" });
            expect(normalizeModulePath("./test")).to.be.equal("/cwd/test");
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

        chunk(() => {
            patchDependencies({ a: 1 });
            expect(cache).to.be.eql({ a: 1 });
        });
    });

    test("resetDependencies()", () => {
        let resetDependencies, cache;

        beforeChunk(() => {
            resetDependencies = rehire.__get__("resetDependencies");
            cache = { a: 1, b: 2 };
            rehire.__set__("require", { cache });
        });

        chunk(() => {
            resetDependencies({ a: 1 });
            expect(cache).to.be.eql({ b: 2 });
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
        let rewire_;

        beforeChunk(() => {
            rewire_ = rehire.__get__("rewire_");
        });

        chunk(() => {
            const mod = rewire_("glace-core");
            const error = mod.__get__("error");
            const help = mod.__get__("help");

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
    });
});
