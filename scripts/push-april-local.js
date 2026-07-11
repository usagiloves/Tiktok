const axios = require('axios');
async function run() {
  const shopId = '7494498334469794054';
  const from = new Date('2026-04-15T00:00:00Z').toISOString();
  const to = new Date('2026-04-25T00:00:00Z').toISOString();
  console.log('Pushing from', from, 'to', to);
  try {
    const res = await axios.post('http://<VPS_IP>:3000/admin/reconcile/orders', { shop_id: shopId, from, to });
    console.log('Result:', res.data.stats);
  } catch(e) {
    console.error(e.message);
  }
}
run();
