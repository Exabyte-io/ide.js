import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { AnyObject } from "@mat3ra/esse/dist/js/esse/types";
import type { BaseInMemoryEntitySchema, QueueSchema } from "@mat3ra/esse/dist/js/types";

import { QUEUE_DISPLAY } from "./enums";

export type QueueHostSchema = BaseInMemoryEntitySchema & QueueSchema & { hostname: string };

/** Per-queue admin-configured override, e.g. a host app's own cluster settings entry. */
export type QueueSettings = {
    displayName?: string;
    maxPPN?: number;
};

/**
 * A cluster queue. `queueSettings` (admin-configured per-queue overrides - a friendlier display
 * name, a premium maxPPN) is passed in rather than reached for via a host-app-specific singleton
 * - keeps this class free of any such dependency. Estimating a queue's wait time needs a live
 * query against the host app's own jobs store, which only ever makes sense server-side and has
 * no place on a class that's also instantiated to represent a queue on the client - see the host
 * app's own use case for that piece (e.g. web-app's `backendEntities/QueuesInfo`).
 */
class Queue extends InMemoryEntity<QueueHostSchema> implements QueueSchema {
    declare _json: QueueHostSchema & AnyObject;

    private readonly queueSettings?: QueueSettings;

    constructor(hostname: string, config: QueueSchema, queueSettings?: QueueSettings) {
        // Ensure `displayName` is always present (schema field) even if backend omits it.
        const displayName =
            config.displayName ||
            queueSettings?.displayName ||
            (config.name in QUEUE_DISPLAY ? QUEUE_DISPLAY[config.name] : config.name);

        super({ ...config, hostname, displayName });
        this.queueSettings = queueSettings;
    }

    get name() {
        return this.requiredProp("name");
    }

    set name(value) {
        this.setProp("name", value);
    }

    get maxNodes() {
        return this.requiredProp("maxNodes");
    }

    set maxNodes(value) {
        this.setProp("maxNodes", value);
    }

    get availableNodes() {
        return this.requiredProp("availableNodes");
    }

    set availableNodes(value) {
        this.setProp("availableNodes", value);
    }

    get currentNodes() {
        return this.requiredProp("currentNodes");
    }

    set currentNodes(value) {
        this.setProp("currentNodes", value);
    }

    get capacity() {
        return this.prop("capacity");
    }

    set capacity(value) {
        this.setProp("capacity", value);
    }

    get displayName() {
        return this.prop("displayName");
    }

    set displayName(value) {
        this.setProp("displayName", value);
    }

    get hostname(): string {
        return this.requiredProp("hostname");
    }

    get maxAvailableNodect(): number {
        return this.availableNodes;
    }

    get currentNodect(): number {
        return this.currentNodes;
    }

    get nodeLimit(): number {
        return this.maxNodes;
    }

    get load(): number {
        // eslint-disable-next-line eqeqeq
        return this.maxAvailableNodect == 0 ? 100 : (this.currentNodect / this.nodeLimit) * 100;
    }

    get maxPPN(): number {
        return this.queueSettings?.maxPPN ?? this.requiredProp("maxPPN");
    }

    set maxPPN(value) {
        this.setProp("maxPPN", value);
    }

    /**
     * @summary Maximum CPU count per node. This parameter is used to let backend job submission
     *          infrastructure know that this job is to be charged for the maximum CPU per
     *          node instead of the actual ppn. For premium/fast queues where resources are
     *          provisioned on-demand and exclusively per user.
     */
    get defaultMaxPPN(): number {
        return this.maxPPN;
    }
}

export default Queue;
