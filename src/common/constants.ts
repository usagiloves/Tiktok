// ============================================
// Queue names
// ============================================
export const QUEUE_NAMES = {
  SYNC_ORDER: 'sync-order',
  SYNC_RETURN: 'sync-return',
  RECONCILE: 'reconcile',
} as const;

// ============================================
// Job names
// ============================================
export const JOB_NAMES = {
  SYNC_ORDER_TO_LARK: 'sync-order-to-lark',
  SYNC_RETURN_TO_LARK: 'sync-return-to-lark',
  RECONCILE_ORDERS: 'reconcile-orders',
  RECONCILE_RETURNS: 'reconcile-returns',
  RETRY_FAILED: 'retry-failed',
} as const;

// ============================================
// Platforms
// ============================================
export const PLATFORMS = {
  TIKTOK: 'TIKTOK',
  SHOPEE: 'SHOPEE',
} as const;

// ============================================
// Request types
// ============================================
export const REQUEST_TYPES = {
  ORDER: 'ORDER',
  RETURN: 'RETURN',
  REFUND: 'REFUND',
  CANCEL: 'CANCEL',
  COMPLAINT: 'COMPLAINT',
} as const;

// ============================================
// Sync actions
// ============================================
export const SYNC_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  SKIP: 'SKIP',
  ERROR: 'ERROR',
} as const;

// ============================================
// Sync sources
// ============================================
export const SYNC_SOURCES = {
  WEBHOOK: 'WEBHOOK',
  CRON: 'CRON',
  MANUAL_RETRY: 'MANUAL_RETRY',
} as const;

// ============================================
// Sync statuses
// ============================================
export const SYNC_STATUSES = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;
