/* eslint-disable max-classes-per-file */
import { expect } from "chai";
import { mix } from "mixwith";

import { ComputedEntityMixin } from "../src/compute";

class Base {}

class Computer extends mix(Base).with(ComputedEntityMixin) {}

describe("Model", () => {
    const obj = {};

    it("can be created", () => {
        const app = new Computer(obj);
        const config = app.constructor.getDefaultComputeConfig();
        expect(config.ppn).to.equal(1);
    });
});
