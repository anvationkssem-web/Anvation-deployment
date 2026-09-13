import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import os from 'node:os';

// Disable the optional GitHub backup sync BEFORE importing the server so the
// module-level .env loader does not kick off a git push that would hang the
// test runner (the repo's .env has GITHUB_BACKUP_SYNC=true).
process.env.GITHUB_BACKUP_SYNC = 'false';

const { startServer } = await import('../server');

function postJSON(port: number, path: string, body: any, cookie?: string): Promise<{ status: number; body: any; setCookie?: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(data)), Connection: 'close' };
    if (cookie) headers.Cookie = cookie;
    const req = http.request({ hostname: '127.0.0.1', port, path, method: 'POST', headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed: any = raw;
        try { parsed = JSON.parse(raw); } catch { /* keep raw */ }
        resolve({ status: res.statusCode || 0, body: parsed, setCookie: String(res.headers['set-cookie'] || '') });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const FAKE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function registerTeam(port: number, suffix: string) {
  return postJSON(port, '/api/register', {
    teamName: `Gate Testers ${suffix}`,
    domain: 'Artificial Intelligence & Machine Learning',
    preferredTrack: 'Artificial Intelligence & Machine Learning',
    leader: { fullName: `Leader ${suffix}`, email: `leader${suffix}@test.com`, phone: '9876543210', usn: `L${suffix}`, college: 'KSSEM', department: 'CSE', yearOfStudy: '2', state: 'Karnataka', gender: 'Male', accommodationRequired: false },
    members: [{ fullName: `Member ${suffix}`, email: `member${suffix}@test.com`, phone: '9123456789', usn: `M${suffix}`, college: 'KSSEM', state: 'Karnataka', gender: 'Male', accommodationRequired: false }],
    paymentUtr: `12934692100${suffix}`,
    paymentUtrConfirm: `12934692100${suffix}`,
    paymentDate: '2026-09-13',
    totalAmount: 500,
    teamSize: 2,
    accommodationRequired: false,
    whatsappJoined: true,
    paymentConfirmed: true,
    paymentScreenshot: FAKE
  });
}

test('WhatsApp group confirmation is optional and does not block registration', async (t) => {
    process.env.DATA_DIR = `${os.tmpdir()}/anvation-wa-test-${Date.now()}`;
    const app: any = await startServer({ listen: false });
    const server = http.createServer(app);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as any).port;

    try {
      // WhatsApp omitted entirely — registration must still succeed.
      const noWa = await postJSON(port, '/api/register', {
        teamName: 'No WhatsApp Team',
        domain: 'Artificial Intelligence & Machine Learning',
        preferredTrack: 'Artificial Intelligence & Machine Learning',
        leader: { fullName: 'Leader NoWa', email: 'leadernowa@test.com', phone: '9876543211', usn: 'LNW', college: 'KSSEM', department: 'CSE', yearOfStudy: '2', state: 'Karnataka', gender: 'Male', accommodationRequired: false },
        members: [{ fullName: 'Member NoWa', email: 'membernowa@test.com', phone: '9123456799', usn: 'MNW', college: 'KSSEM', state: 'Karnataka', gender: 'Male', accommodationRequired: false }],
        paymentUtr: '129346921007',
        paymentUtrConfirm: '129346921007',
        paymentDate: '2026-09-13',
        totalAmount: 500,
        teamSize: 2,
        accommodationRequired: false,
        paymentConfirmed: true,
        paymentScreenshot: FAKE
      });
      assert.equal(noWa.body.success, true, JSON.stringify(noWa.body));
      assert.equal(noWa.body.team.status, 'PENDING_PAYMENT_AUDIT', JSON.stringify(noWa.body.team));

      // WhatsApp explicitly false — registration must still succeed.
      const waFalse = await postJSON(port, '/api/register', {
        teamName: 'WhatsApp False Team',
        domain: 'Artificial Intelligence & Machine Learning',
        preferredTrack: 'Artificial Intelligence & Machine Learning',
        leader: { fullName: 'Leader WaF', email: 'leaderwaf@test.com', phone: '9876543212', usn: 'LWF', college: 'KSSEM', department: 'CSE', yearOfStudy: '2', state: 'Karnataka', gender: 'Male', accommodationRequired: false },
        members: [{ fullName: 'Member WaF', email: 'memberwaf@test.com', phone: '9123456790', usn: 'MWF', college: 'KSSEM', state: 'Karnataka', gender: 'Male', accommodationRequired: false }],
        paymentUtr: '129346921008',
        paymentUtrConfirm: '129346921008',
        paymentDate: '2026-09-13',
        totalAmount: 500,
        teamSize: 2,
        accommodationRequired: false,
        whatsappJoined: false,
        paymentConfirmed: true,
        paymentScreenshot: FAKE
      });
      assert.equal(waFalse.body.success, true, JSON.stringify(waFalse.body));
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  test('participant login is blocked for PENDING and REJECTED teams; APPROVED teams reach auth', async (t) => {
    process.env.DATA_DIR = `${os.tmpdir()}/anvation-gate-test-${Date.now()}`;
    const app: any = await startServer({ listen: false });
    const server = http.createServer(app);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as any).port;

    try {
      const login = await postJSON(port, '/api/admin-login', { identifier: 'superadmin', password: 'AnvationAdmin@2026!' });
      assert.equal(login.body.success, true, JSON.stringify(login.body));
      const cookie = login.setCookie || '';

      const reg = await registerTeam(port, 'P');
      assert.equal(reg.body.success, true, JSON.stringify(reg.body));
      const pendingId = reg.body.team.id;
      const pending = await postJSON(port, '/api/participant-login', { identifier: pendingId, password: 'does-not-matter' });
      assert.equal(pending.status, 403, JSON.stringify(pending.body));
      assert.match(pending.body.error, /pending/i);

      const rej = await postJSON(port, '/api/admin/teams/' + pendingId + '/reject', { reason: 'UTR mismatch found on proof' }, cookie);
      assert.equal(rej.body.success, true, JSON.stringify(rej.body));
      const rejected = await postJSON(port, '/api/participant-login', { identifier: pendingId, password: 'does-not-matter' });
      assert.equal(rejected.status, 403, JSON.stringify(rejected.body));
      assert.match(rejected.body.error, /rejected/i);

      const reg2 = await registerTeam(port, 'A');
      assert.equal(reg2.body.success, true, JSON.stringify(reg2.body));
      const approvedId = reg2.body.team.id;
      const appr = await postJSON(port, '/api/admin/teams/' + approvedId + '/approve', {}, cookie);
      assert.equal(appr.body.success, true, JSON.stringify(appr.body));
      const wrongPass = await postJSON(port, '/api/participant-login', { identifier: approvedId, password: 'definitely-wrong' });
      assert.equal(wrongPass.status, 401, JSON.stringify(wrongPass.body));
      assert.match(wrongPass.body.error, /invalid credentials/i);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

// The server keeps background timers (persist heartbeat, CSV sync queue) alive
// that would otherwise keep the node:test runner waiting forever. Force the
// process to exit once the test lifecycle has finished.
test.after(() => process.exit(0));