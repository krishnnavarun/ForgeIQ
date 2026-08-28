import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { createAccessToken } from "../utils/token.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  createdAt: true,
  memberships: {
    select: { organizationId: true, role: true },
  },
} satisfies Prisma.UserSelect;

function toAuthResponse(user: Prisma.UserGetPayload<{ select: typeof safeUserSelect }>, accessToken: string) {
  return {
    accessToken,
    user,
  };
}

async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await database.authSession.create({ data: { userId, expiresAt } });
  return {
    session,
    accessToken: createAccessToken({ sub: userId, sid: session.id }),
  };
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await database.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        credential: { create: { passwordHash } },
      },
      select: safeUserSelect,
    });
    const { accessToken } = await createSession(user.id);
    return toAuthResponse(user, accessToken);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "EMAIL_ALREADY_REGISTERED", "An account with that email already exists.");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await database.user.findUnique({
    where: { email: input.email },
    include: { credential: true },
  });
  const validPassword = user?.credential
    ? await verifyPassword(input.password, user.credential.passwordHash)
    : false;

  if (!user || !validPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const safeUser = await database.user.findUniqueOrThrow({
    where: { id: user.id },
    select: safeUserSelect,
  });
  const { accessToken } = await createSession(user.id);
  return toAuthResponse(safeUser, accessToken);
}

export async function getAuthenticatedUser(userId: string) {
  return database.user.findUnique({ where: { id: userId }, select: safeUserSelect });
}

export async function revokeSession(sessionId: string, userId: string) {
  await database.authSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}