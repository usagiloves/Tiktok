"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_STATUSES = exports.SYNC_SOURCES = exports.SYNC_ACTIONS = exports.REQUEST_TYPES = exports.PLATFORMS = exports.JOB_NAMES = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    SYNC_ORDER: 'sync-order',
    SYNC_RETURN: 'sync-return',
    RECONCILE: 'reconcile',
};
exports.JOB_NAMES = {
    SYNC_ORDER_TO_LARK: 'sync-order-to-lark',
    SYNC_RETURN_TO_LARK: 'sync-return-to-lark',
    RECONCILE_ORDERS: 'reconcile-orders',
    RECONCILE_RETURNS: 'reconcile-returns',
    RETRY_FAILED: 'retry-failed',
};
exports.PLATFORMS = {
    TIKTOK: 'TIKTOK',
    SHOPEE: 'SHOPEE',
};
exports.REQUEST_TYPES = {
    ORDER: 'ORDER',
    RETURN: 'RETURN',
    REFUND: 'REFUND',
    CANCEL: 'CANCEL',
    COMPLAINT: 'COMPLAINT',
};
exports.SYNC_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    SKIP: 'SKIP',
    ERROR: 'ERROR',
};
exports.SYNC_SOURCES = {
    WEBHOOK: 'WEBHOOK',
    CRON: 'CRON',
    MANUAL_RETRY: 'MANUAL_RETRY',
};
exports.SYNC_STATUSES = {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
};
//# sourceMappingURL=constants.js.map