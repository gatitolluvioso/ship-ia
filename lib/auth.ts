import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const SESSION_COOKIE = "ship_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  company: string | null;
  language: string | null;
  reportEmail: string | null;
  avatarUrl: string | null;
  avatarInitial: string | null;
  avatarColor: string | null;
};

type SessionPayload = {
  id: number;
  email: string;
  exp: number;
};

type UserRow = AuthUser & {
  passwordHash: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const iterations = 210000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString(
    "base64url",
  );

  return `${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [iterationsText, salt, hash] = storedHash.split(":");
  const iterations = Number(iterationsText);

  if (!iterations || !salt || !hash) return false;

  const derived = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(hash, "base64url");

  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createSessionResponse(user: AuthUser, body = { success: true }) {
  const response = NextResponse.json(body);

  response.cookies.set(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function clearSessionResponse(body = { success: true }) {
  const response = NextResponse.json(body);

  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function getCurrentUser(request: NextRequest | Request) {
  const token =
    request instanceof NextRequest
      ? request.cookies.get(SESSION_COOKIE)?.value
      : getCookieFromHeader(request.headers.get("cookie") || "", SESSION_COOKIE);
  const payload = token ? verifySession(token) : null;

  if (!payload) return null;

  return db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        company,
        language,
        reportEmail,
        avatarUrl,
        avatarInitial,
        avatarColor
      FROM users
      WHERE id = ?`,
    )
    .get(payload.id) as AuthUser | undefined;
}

export function getUserByEmail(email: string) {
  return db
    .prepare(
      `SELECT
        id,
        name,
        email,
        passwordHash,
        role,
        company,
        language,
        reportEmail,
        avatarUrl,
        avatarInitial,
        avatarColor
      FROM users
      WHERE email = ?`,
    )
    .get(normalizeEmail(email)) as UserRow | undefined;
}

function signSession(user: AuthUser) {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

function verifySession(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.id || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getCookieFromHeader(header: string, name: string) {
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getSessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "ship-ia-local-development-secret"
  );
}
