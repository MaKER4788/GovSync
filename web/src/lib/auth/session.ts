import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.GOVSYNC_SESSION_SECRET || 'dev-secret-do-not-use-in-production'
);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, secret, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}