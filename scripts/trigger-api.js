const https = require('https');

const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - 5);
fromDate.setHours(0, 0, 0, 0);

const toDate = new Date();
toDate.setHours(23, 59, 59, 999);

const fromStr = fromDate.toISOString();
const toStr = toDate.toISOString();

console.log(`Syncing from ${fromStr} to ${toStr}`);

const data = JSON.stringify({
  shop_id: "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q",
  from: fromStr,
  to: toStr
});

const trigger = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sunbox2.duckdns.org',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      console.log(`[${path}] statusCode: ${res.statusCode}`);
      res.on('data', d => {
        process.stdout.write(d);
      });
      res.on('end', resolve);
    });

    req.on('error', error => {
      console.error(error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

async function run() {
  await trigger('/admin/reconcile/orders');
  await trigger('/admin/reconcile/returns');
}

run();
