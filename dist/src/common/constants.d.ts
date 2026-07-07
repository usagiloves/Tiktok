export declare const QUEUE_NAMES: {
    readonly SYNC_ORDER: "sync-order";
    readonly SYNC_RETURN: "sync-return";
    readonly RECONCILE: "reconcile";
};
export declare const JOB_NAMES: {
    readonly SYNC_ORDER_TO_LARK: "sync-order-to-lark";
    readonly SYNC_RETURN_TO_LARK: "sync-return-to-lark";
    readonly RECONCILE_ORDERS: "reconcile-orders";
    readonly RECONCILE_RETURNS: "reconcile-returns";
    readonly RETRY_FAILED: "retry-failed";
};
export declare const PLATFORMS: {
    readonly TIKTOK: "TIKTOK";
    readonly SHOPEE: "SHOPEE";
};
export declare const REQUEST_TYPES: {
    readonly ORDER: "ORDER";
    readonly RETURN: "RETURN";
    readonly REFUND: "REFUND";
    readonly CANCEL: "CANCEL";
    readonly COMPLAINT: "COMPLAINT";
};
export declare const SYNC_ACTIONS: {
    readonly CREATE: "CREATE";
    readonly UPDATE: "UPDATE";
    readonly SKIP: "SKIP";
    readonly ERROR: "ERROR";
};
export declare const SYNC_SOURCES: {
    readonly WEBHOOK: "WEBHOOK";
    readonly CRON: "CRON";
    readonly MANUAL_RETRY: "MANUAL_RETRY";
};
export declare const SYNC_STATUSES: {
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
};
