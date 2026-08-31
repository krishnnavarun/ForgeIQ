import type { OrganizationMemberRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
      membership?: {
        organizationId: string;
        role: OrganizationMemberRole;
      };
      rawBody?: Buffer;
      /** Coerced/defaulted data from the `validate()` middleware — see its docstring for why this exists instead of mutating req.query/req.params. */
      validated?: {
        params?: Record<string, unknown>;
        query?: Record<string, unknown>;
      };
    }
  }
}

export {};