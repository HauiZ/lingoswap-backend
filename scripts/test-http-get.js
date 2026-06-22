import axios from 'axios';

async function test() {
  try {
    console.log('Sending GET request to http://localhost:5001/health ...');
    const res = await axios.get('http://localhost:5001/health');
    console.log('✅ Response:', res.status, res.data);
    process.exit(0);
  } catch (err) {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
  }
}

test();
