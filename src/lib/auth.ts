import type { AuthConfig } from "@auth/core";
import Facebook from "@auth/core/providers/facebook";
import Google from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "~/db/schema";
import type { SessionData } from "~/server/getSession";
import { db } from "../db";

export const authConfig: AuthConfig = {
  basePath: "/api/auth",
  debug: process.env.NODE_ENV !== "production",
  secret: process.env.AUTH_SECRET,
  adapter: DrizzleAdapter(db, {

    accountsTable: accounts,
    usersTable: users,
    authenticatorsTable: authenticators,
    verificationTokensTable: verificationTokens,
    sessionsTable: sessions,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      const email = user?.email ?? token?.email;
      if (!email) {
        return { ...session };
      }

      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
        with: {
          currentRole: {
            with: {
              organization: true,
            },
          },
        },
      });

      const sessionWithUser = {
        ...session,
        user: { ...session.user, ...dbUser },
      } as SessionData;

      return sessionWithUser;
    },
  },
};
