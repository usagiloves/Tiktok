"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_MIN_DATE = exports.SYNC_STATUSES = exports.SYNC_SOURCES = exports.SYNC_ACTIONS = exports.REQUEST_TYPES = exports.PLATFORMS = exports.JOB_NAMES = exports.QUEUE_NAMES = void 0;
// ============================================
// Queue names
// ============================================
exports.QUEUE_NAMES = {
    SYNC_ORDER: 'sync-order',
    SYNC_RETURN: 'sync-return',
    RECONCILE: 'reconcile',
};
// ============================================
// Job names
// ============================================
exports.JOB_NAMES = {
    SYNC_ORDER_TO_LARK: 'sync-order-to-lark',
    SYNC_RETURN_TO_LARK: 'sync-return-to-lark',
    RECONCILE_ORDERS: 'reconcile-orders',
    RECONCILE_RETURNS: 'reconcile-returns',
    RETRY_FAILED: 'retry-failed',
};
// ============================================
// Platforms
// ============================================
exports.PLATFORMS = {
    TIKTOK: 'TIKTOK',
    SHOPEE: 'SHOPEE',
};
// ============================================
// Request types
// ============================================
exports.REQUEST_TYPES = {
    ORDER: 'ORDER',
    RETURN: 'RETURN',
    REFUND: 'REFUND',
    CANCEL: 'CANCEL',
    COMPLAINT: 'COMPLAINT',
};
// ============================================
// Sync actions
// ============================================
exports.SYNC_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    SKIP: 'SKIP',
    ERROR: 'ERROR',
};
// ============================================
// Sync sources
// ============================================
exports.SYNC_SOURCES = {
    WEBHOOK: 'WEBHOOK',
    CRON: 'CRON',
    MANUAL_RETRY: 'MANUAL_RETRY',
};
// ============================================
// Sync statuses
// ============================================
exports.SYNC_STATUSES = {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
};
// ============================================
// Ngày tối thiểu để sync lên Lark
// Chỉ đồng bộ đơn hàng từ ngày này trở đi.
// ============================================
exports.SYNC_MIN_DATE = new Date('2026-06-20T00:00:00+07:00');
