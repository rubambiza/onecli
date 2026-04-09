import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import {
  OAUTH_ISSUER,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  NEXTAUTH_SECRET,
} from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const oidcProvider: Provider = {
  id: "oidc",
  name: "SSO",
  type: "oidc",
  issuer: OAUTH_ISSUER,
  clientId: OAUTH_CLIENT_ID,
  clientSecret: OAUTH_CLIENT_SECRET,
};

export const { auth, handlers } = NextAuth({
  providers: OAUTH_CLIENT_ID ? [oidcProvider] : [],
  session: { strategy: "jwt" },
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.authId = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.authId as string;
      }
      return session;
    },
  },
});
