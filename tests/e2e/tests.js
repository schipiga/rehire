"use strict";

require("../../").global();

suite("rehire", () => {

    test("module patch", () => {

        chunk("local", () => {
            expect(rehire("./artifacts/mod1")()).to.be.equal("original");
            expect(rehire("./artifacts/mod1", { "./mod2": "patch" })())
                .to.be.equal("patch");
        });

        chunk("global", () => {
            expect(rehire("./artifacts/mod3")())
                .to.be.equal(require("glace-core"));
            expect(rehire("./artifacts/mod3", { "glace-core": "glace" })())
                .to.be.equal("glace");
        });

        chunk("native", () => {
            expect(rehire("./artifacts/mod4")())
                .to.be.equal(require("fs"));
            expect(rehire("./artifacts/mod4", { "fs": "patched fs" })())
                .to.be.equal("patched fs");
        });
    });

    test("module import", () => {

        chunk("local", () => {
            rehire("./artifacts/mod1").__reset__();
        });

        chunk("global", () => {
            rehire("glace-core").__reset__();
        });

        chunk("native", () => {
            expect(() => rehire("fs")).to.throw();
        });
    });
});
