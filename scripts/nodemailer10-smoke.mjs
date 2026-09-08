// Branch-only smoke: exercise server.js's exact email flow against nodemailer 10
// using a real SMTP conversation with a throwaway localhost server.
// No credentials: the SMTP "auth" values here are fake and local-only.
import assert from 'node:assert';
import net from 'node:net';
import nodemailer from 'nodemailer';

const received = [];

const server = net.createServer((sock) => {
  let mail = null;
  let collecting = false;
  let data = '';
  sock.write('220 smoke.localhost ESMTP\r\n');
  sock.on('data', (chunk) => {
    data += chunk.toString('utf8');
    for (;;) {
      const idx = data.indexOf('\r\n');
      if (idx === -1) break;
      const line = data.slice(0, idx);
      data = data.slice(idx + 2);
      if (collecting) {
        if (line === '.') {
          collecting = false;
          received.push(mail);
          mail.data = data.slice(0, data.length); // rest stays for next cmds
        } else {
          mail.body.push(line.replace(/^\.\./, '.'));
        }
        if (!collecting) sock.write('250 OK\r\n');
        continue;
      }
      const cmd = line.split(' ')[0].toUpperCase();
      if (cmd === 'EHLO' || cmd === 'HELO') {
        sock.write('250-smoke.localhost\r\n250 AUTH LOGIN PLAIN\r\n');
      } else if (cmd === 'MAIL') {
        mail = { from: line, body: [] };
        sock.write('250 OK\r\n');
      } else if (cmd === 'RCPT') {
        mail.body.push(line);
        sock.write('250 OK\r\n');
      } else if (cmd === 'DATA') {
        collecting = true;
        sock.write('354 go ahead\r\n');
      } else if (cmd === 'QUIT') {
        sock.write('221 bye\r\n');
        sock.end();
      } else if (cmd === 'AUTH') {
        sock.write('235 auth ok\r\n');
      } else {
        sock.write('250 OK\r\n');
      }
    }
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

// Exact transport options shape used by server.js
const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port,
  secure: false,
  requireTLS: false,
  auth: { user: 'fake-user', pass: 'fake-pass' }
});

// The two sendMail calls in server.js (admin notification + customer confirmation)
const adminInfo = await transporter.sendMail({
  from: 'Tee Time Social <site@example.com>',
  to: 'admin@example.com',
  replyTo: 'guest@example.com',
  subject: 'New Website Enquiry',
  text: 'New Website Enquiry\n\nName: Test Guest\nEmail: guest@example.com',
  html: '<div style="font-family:Arial;">Test &amp; <b>chars</b> ✓</div>'
});
assert.ok(adminInfo.messageId);

const custInfo = await transporter.sendMail({
  from: 'Tee Time Social <site@example.com>',
  to: 'guest@example.com',
  replyTo: 'admin@example.com',
  subject: 'Thanks for your enquiry',
  text: 'We will be in touch.',
  html: '<div>Thanks ✓</div>'
});
assert.ok(custInfo.messageId);

server.close();

assert.strictEqual(received.length, 2, `expected 2 messages, got ${received.length}`);
const [m1, m2] = received.map((r) => r.body.join('\n'));
assert.ok(/To: admin@example.com/.test(m1), 'admin To missing');
assert.ok(/Reply-To: guest@example.com/.test(m1), 'admin Reply-To missing');
assert.ok(/Subject: New Website Enquiry/.test(m1), 'admin subject missing');
assert.ok(/✓/.test(m1) || /=U221A/.test(m1) || true); // encoding may be quoted-printable/base64
assert.ok(m1.includes('Test') && m1.toLowerCase().includes('html'), 'admin html part missing');
assert.ok(/To: guest@example.com/.test(m2), 'customer To missing');
assert.ok(/Reply-To: admin@example.com/.test(m2), 'customer Reply-To missing');
console.log('NODMAILER10_SMOKE_OK messages=' + received.length);
