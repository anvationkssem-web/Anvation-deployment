import { spawn } from 'node:child_process';

const child = spawn('npx', ['tsx', '--test', 'tests/paymentOcrFlow.test.ts', 'tests/adminAuth.test.ts', 'tests/upiVerification.test.ts', 'tests/approvalGateFlow.test.ts'], { stdio: 'inherit', shell: true, cwd: process.cwd() });
const id = setTimeout(() => { console.error('TEST HANG — killing'); child.kill(); process.exit(2); }, 90000);
child.on('exit', (code) => { clearTimeout(id); process.exit(code ?? 0); });
child.on('error', (err) => { console.error('spawn error', err); process.exit(1); });