const { Client } = require('ssh2');

const conn = new Client();

async function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    let output = '';
    conn.exec(cmd, (err, stream) => {
      if (err) reject(err);
      stream.on('close', () => resolve(output)).on('data', data => {
        output += data;
      }).stderr.on('data', data => {
        output += data;
      });
    });
  });
}

conn.on('ready', async () => {
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { ConfigService } = require('@nestjs/config');
    const { HttpService } = require('@nestjs/axios');
    const { firstValueFrom } = require('rxjs');
    
    async function bootstrap() {
      try {
        const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
        const configService = app.get(ConfigService);
        const httpService = app.get(HttpService);
        
        const appId = configService.get('LARK_APP_ID');
        const appSecret = configService.get('LARK_APP_SECRET');
        const appToken = configService.get('LARK_BASE_APP_TOKEN');
        const tableId = configService.get('LARK_TABLE_ID_CSKH');
        
        const tokenRes = await firstValueFrom(
          httpService.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: appId,
            app_secret: appSecret,
          })
        );
        const tenantAccessToken = tokenRes.data.tenant_access_token;
        
        const url = 'https://open.larksuite.com/open-apis/bitable/v1/apps/' + appToken + '/tables/' + tableId + '/fields';
        const fieldsRes = await firstValueFrom(
          httpService.get(url, {
            headers: {
              Authorization: 'Bearer ' + tenantAccessToken
            }
          })
        );
        
        console.log("Danh sách tất cả các trường trên Lark:");
        fieldsRes.data.data.items.forEach(f => {
            console.log('- ' + f.field_name + ' (Type: ' + f.type + ')');
        });
        
        await app.close();
      } catch (e) {
        console.error("Lỗi:", e.response ? e.response.data : e.message);
        process.exit(1);
      }
    }
    bootstrap();
  `;
  
  const cmd = `docker exec -i tiktok_lark_api node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
