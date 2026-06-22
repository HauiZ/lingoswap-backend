/**
 * Script: scripts/check-all-services.js
 * Chạy từng service, kiểm tra startup lỗi syntax/import, sau đó kill.
 *
 * Cách dùng: node scripts/check-all-services.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SERVICES = [
  { name: 'auth-service',         port: 5001, db: 'lingoswap_auth' },
  { name: 'user-service',         port: 5002, db: 'lingoswap_users' },
  { name: 'chat-service',         port: 5003, db: 'lingoswap_chat' },
  { name: 'match-service',        port: 5004, db: 'lingoswap_match' },
  { name: 'friend-service',       port: 5005, db: 'lingoswap_friends' },
  { name: 'notification-service', port: 5006, db: 'lingoswap_notifications' },
  { name: 'presence-service',     port: 5007, db: null },
  { name: 'report-service',       port: 5008, db: 'lingoswap_reports' },
  { name: 'admin-service',        port: 5009, db: 'lingoswap_admin' },
  { name: 'api-gateway',          port: 5000, db: null },
];

const TIMEOUT_MS = 5000; // wait 5s per service to see if it crashes

async function checkService(svc) {
  return new Promise((resolve) => {
    const serverFile = path.join(root, 'services', svc.name, 'server.js');
    const env = {
      ...process.env,
      PORT: String(svc.port),
      REDIS_URI: 'redis://127.0.0.1:6379',
      NODE_ENV: 'development',
    };
    if (svc.db) {
      env.DB_URI = `mongodb://localhost:27017/${svc.db}`;
    }

    let stderr = '';
    let stdout = '';
    let crashed = false;

    const serviceDir = path.join(root, 'services', svc.name);
    const proc = spawn('node', [serverFile], { env, cwd: serviceDir });

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('exit', (code) => {
      crashed = true;
      clearTimeout(timer);
      resolve({ name: svc.name, ok: false, error: stderr || stdout, exitCode: code });
    });

    const timer = setTimeout(() => {
      if (!crashed) {
        proc.kill('SIGTERM');
        // Running for 5s without crashing = OK
        resolve({ name: svc.name, ok: true, stdout, stderr });
      }
    }, TIMEOUT_MS);
  });
}

async function main() {
  console.log('🔍 Checking all services for startup errors...\n');
  const results = [];

  for (const svc of SERVICES) {
    process.stdout.write(`  → ${svc.name.padEnd(25)} `);
    const result = await checkService(svc);
    if (result.ok) {
      console.log('✅ OK');
    } else {
      console.log('❌ FAILED');
      // Show first 3 lines of error
      const firstErr = (result.error || '').split('\n').slice(0, 5).join('\n');
      console.log(`     ${firstErr.replace(/\n/g, '\n     ')}`);
    }
    results.push(result);
  }

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  console.log(`✅ Passed: ${passed.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.map(r => r.name).join(', ')}`);
    process.exit(1);
  } else {
    console.log('🎉 All services start without errors!');
    process.exit(0);
  }
}

main();
