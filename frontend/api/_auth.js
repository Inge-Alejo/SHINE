import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'shine_super_secret_jwt_key_2026_colombia';

export function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 7) // 7 días
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3 && parts.length !== 2) {
    return null;
  }

  if (parts.length === 3) {
    const [headerB64, payloadB64, signature] = parts;
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expected) return null;

    try {
      const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // Compatibilidad con tokens legacy de 2 partes
  const [payloadB64, signature] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('hex');
  if (signature !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

