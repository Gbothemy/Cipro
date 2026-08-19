const encoder = new TextEncoder();

function secret() {
  const value = process.env.AUTH_SECRET || process.env.DATABASE_URL;
  if (!value) throw new Error('AUTH_SECRET is not configured');
  return value;
}

function encode(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return new Uint8Array([...binary].map((char) => char.charCodeAt(0)));
}

async function key() {
  return crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(user) {
  const payload = encode(JSON.stringify({
    userId: user.userId,
    isAdmin: Boolean(user.isAdmin),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }));
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token) {
  try {
    const [payload, signature] = token?.split('.') || [];
    if (!payload || !signature) return null;
    const valid = await crypto.subtle.verify('HMAC', await key(), decode(signature), encoder.encode(payload));
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(decode(payload)));
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}
