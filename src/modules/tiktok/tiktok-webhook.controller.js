"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokWebhookController = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../common/constants");
var crypto = __importStar(require("crypto"));
var TiktokWebhookController = function () {
    var _classDecorators = [(0, common_1.Controller)('webhooks/tiktok')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handleOrderStatus_decorators;
    var _handleReturnStatus_decorators;
    var TiktokWebhookController = _classThis = /** @class */ (function () {
        function TiktokWebhookController_1(configService, prisma, syncQueue) {
            this.configService = (__runInitializers(this, _instanceExtraInitializers), configService);
            this.prisma = prisma;
            this.syncQueue = syncQueue;
            this.logger = new common_1.Logger(TiktokWebhookController.name);
        }
        // ============================================
        // Verify Webhook Signature
        // ============================================
        TiktokWebhookController_1.prototype.verifySignature = function (body, signature) {
            var _a;
            if (!signature)
                return false;
            var webhookSecret = (_a = this.configService.get('TIKTOK_WEBHOOK_SECRET')) !== null && _a !== void 0 ? _a : '';
            var expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');
            return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
        };
        // ============================================
        // Order Status Webhook
        // ============================================
        /**
         * POST /webhooks/tiktok/order-status
         * Nhận event khi đơn thay đổi trạng thái.
         */
        TiktokWebhookController_1.prototype.handleOrderStatus = function (body, signature) {
            return __awaiter(this, void 0, void 0, function () {
                var bodyString, signatureValid, eventId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bodyString = JSON.stringify(body);
                            signatureValid = this.verifySignature(bodyString, signature);
                            this.logger.log("\uD83D\uDCE5 Webhook order-status received. Signature valid: ".concat(signatureValid));
                            eventId = body.event_id ||
                                "order_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(7));
                            return [4 /*yield*/, this.prisma.webhookEvent.upsert({
                                    where: {
                                        platform_eventId: {
                                            platform: constants_1.PLATFORMS.TIKTOK,
                                            eventId: eventId,
                                        },
                                    },
                                    update: {
                                        rawPayload: body,
                                        signatureValid: signatureValid,
                                    },
                                    create: {
                                        platform: constants_1.PLATFORMS.TIKTOK,
                                        eventType: 'ORDER_STATUS_CHANGE',
                                        eventId: eventId,
                                        shopId: body.shop_id,
                                        orderId: body.order_id,
                                        rawPayload: body,
                                        signatureValid: signatureValid,
                                    },
                                })];
                        case 1:
                            _a.sent();
                            if (!signatureValid) {
                                this.logger.error('❌ Invalid webhook signature');
                                return [2 /*return*/, { code: 0, message: 'ok' }]; // Vẫn trả 200 để TikTok không retry
                            }
                            // Đẩy job vào queue
                            return [4 /*yield*/, this.syncQueue.add(constants_1.JOB_NAMES.SYNC_ORDER_TO_LARK, {
                                    orderId: body.order_id,
                                    shopId: body.shop_id,
                                    eventType: 'ORDER_STATUS_CHANGE',
                                    source: 'WEBHOOK',
                                }, {
                                    attempts: 3,
                                    backoff: { type: 'exponential', delay: 5000 },
                                    removeOnComplete: 100,
                                    removeOnFail: 500,
                                })];
                        case 2:
                            // Đẩy job vào queue
                            _a.sent();
                            return [2 /*return*/, { code: 0, message: 'ok' }];
                    }
                });
            });
        };
        // ============================================
        // Return/Refund Status Webhook
        // ============================================
        /**
         * POST /webhooks/tiktok/return-status
         * Nhận event khi yêu cầu hoàn/trả thay đổi trạng thái.
         */
        TiktokWebhookController_1.prototype.handleReturnStatus = function (body, signature) {
            return __awaiter(this, void 0, void 0, function () {
                var bodyString, signatureValid, eventId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bodyString = JSON.stringify(body);
                            signatureValid = this.verifySignature(bodyString, signature);
                            this.logger.log("\uD83D\uDCE5 Webhook return-status received. Signature valid: ".concat(signatureValid));
                            eventId = body.event_id ||
                                "return_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(7));
                            return [4 /*yield*/, this.prisma.webhookEvent.upsert({
                                    where: {
                                        platform_eventId: {
                                            platform: constants_1.PLATFORMS.TIKTOK,
                                            eventId: eventId,
                                        },
                                    },
                                    update: {
                                        rawPayload: body,
                                        signatureValid: signatureValid,
                                    },
                                    create: {
                                        platform: constants_1.PLATFORMS.TIKTOK,
                                        eventType: 'RETURN_STATUS_CHANGE',
                                        eventId: eventId,
                                        shopId: body.shop_id,
                                        orderId: body.order_id,
                                        rawPayload: body,
                                        signatureValid: signatureValid,
                                    },
                                })];
                        case 1:
                            _a.sent();
                            if (!signatureValid) {
                                this.logger.error('❌ Invalid webhook signature');
                                return [2 /*return*/, { code: 0, message: 'ok' }];
                            }
                            return [4 /*yield*/, this.syncQueue.add(constants_1.JOB_NAMES.SYNC_RETURN_TO_LARK, {
                                    returnId: body.reverse_order_id || body.return_id,
                                    orderId: body.order_id,
                                    shopId: body.shop_id,
                                    eventType: 'RETURN_STATUS_CHANGE',
                                    source: 'WEBHOOK',
                                }, {
                                    attempts: 3,
                                    backoff: { type: 'exponential', delay: 5000 },
                                    removeOnComplete: 100,
                                    removeOnFail: 500,
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { code: 0, message: 'ok' }];
                    }
                });
            });
        };
        return TiktokWebhookController_1;
    }());
    __setFunctionName(_classThis, "TiktokWebhookController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleOrderStatus_decorators = [(0, common_1.Post)('order-status'), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _handleReturnStatus_decorators = [(0, common_1.Post)('return-status'), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        __esDecorate(_classThis, null, _handleOrderStatus_decorators, { kind: "method", name: "handleOrderStatus", static: false, private: false, access: { has: function (obj) { return "handleOrderStatus" in obj; }, get: function (obj) { return obj.handleOrderStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleReturnStatus_decorators, { kind: "method", name: "handleReturnStatus", static: false, private: false, access: { has: function (obj) { return "handleReturnStatus" in obj; }, get: function (obj) { return obj.handleReturnStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TiktokWebhookController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TiktokWebhookController = _classThis;
}();
exports.TiktokWebhookController = TiktokWebhookController;
