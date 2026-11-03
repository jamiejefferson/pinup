/**
 * Signed session tokens, used for both login cookies.
 *
 * A token is `<base64url JSON>.<base64url HMAC-SHA256>`. The purpose is mixed
 * into the signature, so a client cookie cannot be replayed as an admin cookie.
 *
 * Uses Web Crypto because middleware runs on the Edge runtime.
 */

export type SessionPurpose = 'client' | 'admin';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MIN_SECRET_LENGTH = 32;

function getKey(): Promise<CryptoKey> {
  const secret = process.env.PINUP_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `PINUP_SESSION_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`
    );
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function signedInput(purpose: SessionPurpose, body: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(`pinup:${purpose}:${body}`);
}

/**
 * Create a signed token. Throws if the signing secret is missing, so a login
 * fails visibly and never issues an unsigned cookie.
 */
export async function signSessionToken(
  purpose: SessionPurpose,
  payload: object
): Promise<string> {
  const key = await getKey();
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    signedInput(purpose, body)
  );
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Return the payload of a validly signed token, or null. Malformed tokens,
 * bad signatures and a missing secret all count as not logged in.
 */
export async function verifySessionToken<T>(
  purpose: SessionPurpose,
  token: string
): Promise<T | null> {
  try {
    const [body, signature, ...rest] = token.split('.');
    if (!body || !signature || rest.length > 0) {
      return null;
    }

    const key = await getKey();
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature),
      signedInput(purpose, body)
    );
    if (!isValid) {
      return null;
    }

    return JSON.parse(decoder.decode(fromBase64Url(body))) as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('PINUP_SESSION_SECRET')) {
      console.error(error.message);
    }
    return null;
  }
}
