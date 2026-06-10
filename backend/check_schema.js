const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
client.connect().then(() => client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'branches'")).then(res => { console.log(res.rows); process.exit(); });
