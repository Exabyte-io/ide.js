import type { QueueSchema } from "@mat3ra/esse/dist/js/types";
import { expect } from "chai";

import Queue, { type QueueSettings } from "../../src/js/nodes/queue";

function makeQueue(config: Partial<QueueSchema> = {}, queueSettings?: QueueSettings) {
    return new Queue(
        "cluster-001",
        {
            name: "OR",
            maxPPN: 16,
            maxNodes: 10,
            availableNodes: 10,
            currentNodes: 0,
            ...config,
        },
        queueSettings,
    );
}

describe("Queue", () => {
    it("derives maxAvailableNodect/currentNodect/nodeLimit from the schema's own fields", () => {
        const queue = makeQueue({ availableNodes: 7, currentNodes: 3, maxNodes: 10 });
        expect(queue.maxAvailableNodect).to.equal(7);
        expect(queue.currentNodect).to.equal(3);
        expect(queue.nodeLimit).to.equal(10);
    });

    it("exposes the hostname it was constructed with", () => {
        const queue = new Queue("cluster-002", {
            name: "OR",
            maxPPN: 16,
            maxNodes: 10,
            availableNodes: 10,
            currentNodes: 0,
        });
        expect(queue.hostname).to.equal("cluster-002");
    });

    it("reports 100% load when no nodes are available", () => {
        const queue = makeQueue({ availableNodes: 0, currentNodes: 0, maxNodes: 10 });
        expect(queue.load).to.equal(100);
    });

    it("computes load as a percentage of nodes in use out of the node limit", () => {
        const queue = makeQueue({ availableNodes: 5, currentNodes: 5, maxNodes: 10 });
        expect(queue.load).to.equal(50);
    });

    it("falls back to the schema's own name for displayName when nothing else provides one", () => {
        const queue = makeQueue({ name: "OR" });
        expect(queue.displayName).to.equal("ordinary regular (OR)");
    });

    it("prefers the config's own displayName over everything else", () => {
        const queue = makeQueue({ displayName: "Custom name" });
        expect(queue.displayName).to.equal("Custom name");
    });

    it("prefers queueSettings.displayName over the QUEUE_DISPLAY fallback", () => {
        const queue = makeQueue({}, { displayName: "Settings name" });
        expect(queue.displayName).to.equal("Settings name");
    });

    it("uses the schema's own maxPPN when queueSettings doesn't override it", () => {
        const queue = makeQueue({ maxPPN: 8 });
        expect(queue.maxPPN).to.equal(8);
        expect(queue.defaultMaxPPN).to.equal(8);
    });

    it("prefers queueSettings.maxPPN over the schema's own value", () => {
        const queue = makeQueue({ maxPPN: 8 }, { maxPPN: 32 });
        expect(queue.maxPPN).to.equal(32);
        expect(queue.defaultMaxPPN).to.equal(32);
    });
});
