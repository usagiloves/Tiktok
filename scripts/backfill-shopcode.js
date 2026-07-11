"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var core_1 = require("@nestjs/core");
var app_module_1 = require("../src/app.module");
var reconcile_service_1 = require("../src/modules/reconcile/reconcile.service");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var app, reconcileService, databaseUrl, prisma, shops, fromTimestamp, toTimestamp, _i, shops_1, shop, rStats, oStats, currentTo, currentFrom, rStats, oStats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, core_1.NestFactory.createApplicationContext(app_module_1.AppModule)];
                case 1:
                    app = _a.sent();
                    reconcileService = app.get(reconcile_service_1.ReconcileService);
                    databaseUrl = process.env.DATABASE_URL;
                    if (!databaseUrl) {
                        throw new Error('DATABASE_URL is required');
                    }
                    prisma = new client_1.PrismaClient({
                        adapter: new adapter_pg_1.PrismaPg(databaseUrl),
                    });
                    return [4 /*yield*/, prisma.shop.findMany({
                            where: { isActive: true },
                        })];
                case 2:
                    shops = _a.sent();
                    fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00Z').getTime() / 1000);
                    toTimestamp = Math.floor(Date.now() / 1000);
                    console.log("Starting backfill from timestamp ".concat(fromTimestamp, " to ").concat(toTimestamp));
                    _i = 0, shops_1 = shops;
                    _a.label = 3;
                case 3:
                    if (!(_i < shops_1.length)) return [3 /*break*/, 11];
                    shop = shops_1[_i];
                    console.log("\nBackfilling shop ".concat(shop.shopName, " (").concat(shop.platform, ")"));
                    if (!(shop.platform === 'TIKTOK')) return [3 /*break*/, 6];
                    console.log('--- Fetching Returns ---');
                    return [4 /*yield*/, reconcileService.reconcileReturns(shop.shopId, fromTimestamp, toTimestamp)];
                case 4:
                    rStats = _a.sent();
                    console.log('Returns stats:', rStats);
                    console.log('--- Fetching Orders ---');
                    return [4 /*yield*/, reconcileService.reconcileOrders(shop.shopId, fromTimestamp, toTimestamp)];
                case 5:
                    oStats = _a.sent();
                    console.log('Orders stats:', oStats);
                    return [3 /*break*/, 10];
                case 6:
                    if (!(shop.platform === 'SHOPEE')) return [3 /*break*/, 10];
                    console.log('Shopee API max range is 15 days, we will just use the current backfill cron for Shopee');
                    currentTo = toTimestamp;
                    _a.label = 7;
                case 7:
                    if (!(currentTo > fromTimestamp)) return [3 /*break*/, 10];
                    currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
                    console.log("--- Fetching Shopee Returns ".concat(new Date(currentFrom * 1000).toISOString(), " to ").concat(new Date(currentTo * 1000).toISOString(), " ---"));
                    return [4 /*yield*/, reconcileService.reconcileShopeeReturns(shop.shopId, currentFrom, currentTo)];
                case 8:
                    rStats = _a.sent();
                    console.log('Shopee Returns stats:', rStats);
                    console.log("--- Fetching Shopee Orders ".concat(new Date(currentFrom * 1000).toISOString(), " to ").concat(new Date(currentTo * 1000).toISOString(), " ---"));
                    return [4 /*yield*/, reconcileService.reconcileShopeeOrders(shop.shopId, currentFrom, currentTo)];
                case 9:
                    oStats = _a.sent();
                    console.log('Shopee Orders stats:', oStats);
                    currentTo = currentFrom;
                    return [3 /*break*/, 7];
                case 10:
                    _i++;
                    return [3 /*break*/, 3];
                case 11:
                    console.log('\nBackfill completed!');
                    return [4 /*yield*/, app.close()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
});
