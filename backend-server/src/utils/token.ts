import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type AccessTokenClaims = {
  sub: string;
  sid: string;
};

export function createAccessToken(claims: AccessTokenClaims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims;
}