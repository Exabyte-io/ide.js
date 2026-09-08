import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { AnyObject } from "@mat3ra/esse/dist/js/esse/types";
import type { BaseInMemoryEntitySchema, QueueSchema } from "@mat3ra/esse/dist/js/types";

import { ETA, QUEUE_DISPLAY } from "./enums";

export type QueueHostSchema = BaseInMemoryEntitySchema & QueueSchema & { hostname: string };

/** Per-queue admin-configured override, e.g. a host app's own cluster settings entry. */
export type QueueSettings = {
    displayName?: string;
    maxPPN?: number;
};

/**
 * Minimal shape {@link Queue.getETA} needs from the host app's jobs store - deliberately not
 * `Mongo.Collection`, so this class carries no Meteor/Mongo dependency of its own; a real
 * collection satisfies this structurally, no adapter needed.
 */
export interface QueueJobFinder {
    findOneAsync(selector: {
        "compute.queue": string;
        startTime: string;
    }): Promise<{ startTime?: string } | null | undefined>;
}

const sortedETA = Object.values(ETA).sort((a, b) => b.order - a.order);

/**
 * A cluster queue. `queueSettings` (admin-configured per-queue overrides - a friendlier display
 * name, a premium maxPPN) and `jobs` (used only by {@link getETA}, to estimate wait time from
 * currently submitted jobs) are both passed in rather than reached for via a host-app-specific
 * singleton or global collection - keeps this class free of any such dependency, so it's equally
 * safe to construct on the client (where `jobs` is simply omitted - there's no live jobs store to
 * query there) and on the server (where the host app passes its own jobs collection).
 */
class Queue extends InMemoryEntity<QueueHostSchema> implements QueueSchema {
    declare _json: QueueHostSchema & AnyObject;

    private readonly queueSettings?: QueueSettings;

    private readonly jobs?: QueueJobFinder;

    constructor(
        hostname: string,
        config: QueueSchema,
        queueSettings?: QueueSettings,
        jobs?: QueueJobFinder,
    ) {
        // Ensure `displayName` is always present (schema field) even if backend omits it.
        const displayName =
            config.displayName ||
            queueSettings?.displayName ||
            (config.name in QUEUE_DISPLAY ? QUEUE_DISPLAY[config.name] : config.name);

        super({ ...config, hostname, displayName });
        this.queueSettings = queueSettings;
        this.jobs = jobs;
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

    /**
     * @summary Estimates this queue's wait time from currently submitted jobs. Resolves to
     * `ETA.withinFiveMin` (same fallback as "nothing queued") if no `jobs` finder was supplied
     * at construction - the client-side case, where there's no live jobs store to query.
     */
    async getETA() {
        // eslint-disable-next-line eqeqeq
        if (this.maxAvailableNodect == 0) {
            return ETA.moreThanHour;
        }
        if (!this.jobs) {
            return ETA.withinFiveMin;
        }

        const { jobs, name } = this;
        const job = await sortedETA.reduce<Promise<{ startTime?: string } | null | undefined>>(
            async (acc, value) => {
                const job = await acc;
                if (job) {
                    return job;
                }
                return jobs.findOneAsync({ "compute.queue": name, startTime: value.display });
            },
            Promise.resolve(undefined),
        );

        return Object.values(ETA).find((x) => x.display === job?.startTime) || ETA.withinFiveMin;
    }
}

export default Queue;
