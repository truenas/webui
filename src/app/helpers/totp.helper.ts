/**
 * A minimal RFC 6238 (TOTP) / RFC 4226 (HOTP) verifier that runs in the browser.
 *
 * The middleware has no "check this code without enabling anything" endpoint —
 * `user.renew_2fa_secret` both mints the secret and arms it — so the confirmation
 * step on the 2FA setup page has to check the code the user reads off their
 * authenticator app locally, against the secret the QR code carries.
 *
 * That makes this a usability check ("your app really did register this secret"),
 * not a security boundary: the authoritative check still happens at login, in the
 * middleware. Hence also the hand-rolled SHA-1 rather than `crypto.subtle`, which
 * is undefined on the plain-HTTP LAN addresses much of the UI is served from.
 */

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const sha1BlockSize = 64;
const sha1DigestSize = 20;

function rotateLeft(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function sha1(message: Uint8Array): Uint8Array {
  // Message plus the 0x80 terminator and the 8-byte length, rounded up to whole blocks.
  const padded = new Uint8Array((((message.length + 8) >> 6) + 1) << 6);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLength = message.length * 8;
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;

  const words = new Uint32Array(80);

  for (let block = 0; block < padded.length; block += sha1BlockSize) {
    for (let index = 0; index < 16; index++) {
      words[index] = view.getUint32(block + index * 4, false);
    }
    for (let index = 16; index < 80; index++) {
      words[index] = rotateLeft(
        words[index - 3] ^ words[index - 8] ^ words[index - 14] ^ words[index - 16],
        1,
      );
    }

    // a-e in the RFC 3174 pseudocode.
    let wordA = h0;
    let wordB = h1;
    let wordC = h2;
    let wordD = h3;
    let wordE = h4;

    for (let index = 0; index < 80; index++) {
      let mix: number;
      let roundConstant: number;
      if (index < 20) {
        mix = (wordB & wordC) | (~wordB & wordD);
        roundConstant = 0x5A827999;
      } else if (index < 40) {
        mix = wordB ^ wordC ^ wordD;
        roundConstant = 0x6ED9EBA1;
      } else if (index < 60) {
        mix = (wordB & wordC) | (wordB & wordD) | (wordC & wordD);
        roundConstant = 0x8F1BBCDC;
      } else {
        mix = wordB ^ wordC ^ wordD;
        roundConstant = 0xCA62C1D6;
      }

      const rotated = (rotateLeft(wordA, 5) + mix + wordE + roundConstant + words[index]) >>> 0;
      wordE = wordD;
      wordD = wordC;
      wordC = rotateLeft(wordB, 30);
      wordB = wordA;
      wordA = rotated;
    }

    h0 = (h0 + wordA) >>> 0;
    h1 = (h1 + wordB) >>> 0;
    h2 = (h2 + wordC) >>> 0;
    h3 = (h3 + wordD) >>> 0;
    h4 = (h4 + wordE) >>> 0;
  }

  const digest = new Uint8Array(sha1DigestSize);
  const digestView = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4].forEach((word, index) => digestView.setUint32(index * 4, word, false));

  return digest;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockKey = new Uint8Array(sha1BlockSize);
  blockKey.set(key.length > sha1BlockSize ? sha1(key) : key);

  const inner = new Uint8Array(sha1BlockSize + message.length);
  const outer = new Uint8Array(sha1BlockSize + sha1DigestSize);
  for (let index = 0; index < sha1BlockSize; index++) {
    inner[index] = blockKey[index] ^ 0x36;
    outer[index] = blockKey[index] ^ 0x5C;
  }
  inner.set(message, sha1BlockSize);
  outer.set(sha1(inner), sha1BlockSize);

  return sha1(outer);
}

/**
 * Decodes an RFC 4648 base32 secret, ignoring the spacing and `=` padding that
 * authenticator apps and provisioning URIs sprinkle through them.
 *
 * Returns `null` for text that is not base32, which {@link verifyTotp} reports as a
 * failed check — the page tells an unusable secret apart from a wrong code earlier, by
 * whether the provisioning URI parsed at all.
 */
function decodeBase32(secret: string): Uint8Array | null {
  const normalized = secret.replace(/[\s=-]/g, '').toUpperCase();
  if (!normalized.length) {
    return null;
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of normalized) {
    const value = base32Alphabet.indexOf(character);
    if (value === -1) {
      return null;
    }

    buffer = (buffer << 5) | value;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xFF);
    }
  }

  return bytes.length ? new Uint8Array(bytes) : null;
}

function generateHotp(key: Uint8Array, counter: number, digits: number): string {
  const counterBytes = new Uint8Array(8);
  const counterView = new DataView(counterBytes.buffer);
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  counterView.setUint32(4, counter >>> 0, false);

  const digest = hmacSha1(key, counterBytes);
  const offset = digest[digest.length - 1] & 0x0F;
  const binary = ((digest[offset] & 0x7F) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];

  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

export interface TotpOptions {
  /** Length of a time step, in seconds. */
  interval?: number;
  /** Number of digits in a code. */
  digits?: number;
  /** How many time steps either side of now are still accepted, to absorb clock skew. */
  window?: number;
  /** Milliseconds since the epoch to verify against. Defaults to the current time. */
  now?: number;
}

/**
 * Whether `code` is a one-time password currently derivable from `secret`.
 *
 * Accepts codes from `window` steps either side of the current one, the usual
 * allowance for a phone whose clock has drifted or a user who typed slowly.
 */
export function verifyTotp(secret: string, code: string, options: TotpOptions = {}): boolean {
  const {
    interval = 30, digits = 6, window = 1, now = Date.now(),
  } = options;

  const normalizedCode = code.replace(/\s/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(normalizedCode)) {
    return false;
  }

  const key = decodeBase32(secret);
  if (!key) {
    return false;
  }

  const counter = Math.floor(now / 1000 / interval);
  for (let drift = -window; drift <= window; drift++) {
    if (generateHotp(key, counter + drift, digits) === normalizedCode) {
      return true;
    }
  }

  return false;
}
