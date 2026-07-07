import { SyncEngineService } from '../sync/sync-engine.service';
import { ReconcileService } from '../reconcile/reconcile.service';
import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AdminController {
    private readonly syncEngine;
    private readonly reconcileService;
    private readonly prisma;
    private readonly logger;
    constructor(syncEngine: SyncEngineService, reconcileService: ReconcileService, prisma: PrismaService);
    retrySync(body: {
        sync_key: string;
    }): Promise<{
        success: boolean;
        action: string;
        sync_key: string;
    }>;
    reconcileOrders(body: {
        shop_id: string;
        from: string;
        to: string;
    }): Promise<{
        success: boolean;
        stats: {
            total: number;
            created: number;
            updated: number;
            skipped: number;
            errors: number;
        };
    }>;
    reconcileReturns(body: {
        shop_id: string;
        from: string;
        to: string;
    }): Promise<{
        success: boolean;
        stats: {
            total: number;
            created: number;
            updated: number;
            skipped: number;
            errors: number;
        };
    }>;
    getDashboard(): Promise<{
        status: string;
        time: string;
        today: {
            totalSync: number;
            failedSync: number;
            successRate: string;
        };
        shops: {
            shopId: string;
            platform: string;
            shopName: string | null;
            brand: string | null;
        }[];
        tokens: {
            shopId: string;
            accessTokenValid: boolean;
            refreshTokenValid: boolean;
            accessTokenExpiresIn: number;
        }[];
        recentErrors: {
            createdAt: Date;
            syncKey: string | null;
            action: string | null;
            traceId: string | null;
            source: string | null;
            errorMessage: string | null;
        }[];
    }>;
}
