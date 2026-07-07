"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('APP_PORT', 3000);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors();
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📋 Health check: http://localhost:${port}/health`);
    logger.log(`🔗 TikTok OAuth: http://localhost:${port}/tiktok/oauth/authorize`);
}
bootstrap();
//# sourceMappingURL=main.js.map