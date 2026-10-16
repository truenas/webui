/**
 * Time-based one-time passwords (RFC 6238), for signing in as an account with
 * two-factor authentication.
 *
 * Written here because nothing else will do it: no TOTP library is installed,
 * and the app's own `totp.helper.ts` exports only a verifier. Node's HMAC-SHA1
 * does the hashing. The parameters are the ones the app asks middleware for
 * (`user.renew_2fa_secret` with a 30-second interval and six digits), so a code
 * from here is the code an authenticator app would show.
 */
import { createHmac } from 'node:crypto';

const intervalSeconds = 30;
const digits = 6;
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * The code for `secret` at `atMs` (milliseconds since the epoch), or now.
 *
 * `secret` is the base32 text the app shows beside the QR code. Spaces and
 * padding are ignored, and case does not matter.
 */
export function totpCode(secret: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / intervalSeconds);
  // The counter as an 8-byte big-endian integer, written as two 32-bit halves.
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  message.writeUInt32BE(counter % 2 ** 32, 4);

  const hmac = createHmac('sha1', decodeBase32(secret)).update(message).digest();

  // Dynamic truncation (RFC 4226 §5.3): the low nibble of the last byte picks
  // four bytes, whose top bit is dropped.
  const offset = hmac.readUInt8(hmac.length - 1) & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 10 ** digits).padStart(digits, '0');
}

/**
 * A code of the right shape that `secret` will not accept now.
 *
 * The code from an hour ago, far outside any tolerance window a person would
 * configure. Checked against the current one too, since two counters can still
 * share a code by chance — one in a million — and a "wrong" code that happened
 * to be right would make the refusal it is used for pass for nothing.
 */
export function wrongTotpCode(secret: string, atMs: number = Date.now()): string {
  const current = totpCode(secret, atMs);
  const hourMs = 60 * 60 * 1000;
  const anHourAgo = totpCode(secret, atMs - hourMs);

  return anHourAgo === current ? totpCode(secret, atMs - 2 * hourMs) : anHourAgo;
}

function decodeBase32(secret: string): Buffer {
  const characters = secret.replace(/[\s=]/g, '').toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of characters) {
    const value = base32Alphabet.indexOf(character);
    if (value === -1) {
      throw new Error(`"${character}" is not a base32 character, so this is not a TOTP secret.`);
    }

    // Only the bits not yet emitted are kept, so the accumulator stays small.
    buffer = ((buffer << 5) | value) & 0xfff;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}
