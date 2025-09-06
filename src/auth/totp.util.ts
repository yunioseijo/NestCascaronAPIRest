import * as crypto from 'crypto';

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits = '';
  for (const c of clean) {
    const val = alphabet.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTOTP(secretBase32: string, timeStepSeconds = 30, digits = 6, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / timeStepSeconds);
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  const str = (code % 10 ** digits).toString().padStart(digits, '0');
  return str;
}

export function verifyTOTP(secretBase32: string, code: string, window = 1, timeStepSeconds = 30, digits = 6, timestamp = Date.now()) {
  for (let w = -window; w <= window; w++) {
    const t = timestamp + w * timeStepSeconds * 1000;
    const expected = generateTOTP(secretBase32, timeStepSeconds, digits, t);
    if (expected === code) return true;
  }
  return false;
}

export function randomBase32Secret(size = 20) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const buf = crypto.randomBytes(size);
  let out = '';
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) break;
    out += alphabet[parseInt(chunk, 2)];
  }
  // pad to multiple of 8 chars
  while (out.length % 8 !== 0) out += '=';
  return out;
}
