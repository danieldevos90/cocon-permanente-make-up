import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ISSUER = "afa-message-platform";

function secretKey(): Uint8Array {
  const raw =
    process.env.API_JWT_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SYNC_API_TOKEN ||
    "";
  if (!raw) {
    throw new Error("API_JWT_SECRET (or CRON_SECRET) not configured");
  }
  return new TextEncoder().encode(raw);
}

export type ApiJwtPayload = JWTPayload & {
  sub: string;
  role?: string;
};

/** Issue a short-lived API JWT (default 24h). */
export async function signApiJwt(
  subject = "api",
  expiresIn: string | number = "24h"
): Promise<string> {
  return new SignJWT({ role: "api" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifyApiJwt(
  token: string
): Promise<{ valid: true; payload: ApiJwtPayload } | { valid: false; error: string }> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return { valid: true, payload: payload as ApiJwtPayload };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function looksLikeJwt(token: string): boolean {
  return token.split(".").length === 3;
}
