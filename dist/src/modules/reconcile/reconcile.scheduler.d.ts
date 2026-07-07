import { ReconcileService } from './reconcile.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ReconcileScheduler {
    private readonly reconcileService;
    private readonly larkBot;
    private readonly prisma;
    private readonly logger;
    constructor(reconcileService: ReconcileService, larkBot: LarkBotService, prisma: PrismaService);
    reconcileRecentOrders(): Promise<void>;
    reconcileRecentReturns(): Promise<void>;
    reconcileWeeklyOrders(): Promise<void>;
    reconcileMonthlyReturns(): Promise<void>;
    private getActiveShops;
}
