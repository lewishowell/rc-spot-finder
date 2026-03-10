import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Instagram Login provider using the Instagram API with Instagram Login.
 * The old Basic Display API (instagram_basic scope) is fully deprecated.
 * All Instagram API access now requires instagram_business_* scopes and
 * a professional (Business or Creator) account — the upgrade is free.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
function InstagramLogin() {
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth" as const,
    authorization: {
      url: "https://www.instagram.com/oauth/authorize",
      params: {
        enable_fb_login: "0",
        force_authentication: "1",
        response_type: "code",
        scope: "instagram_business_basic,instagram_business_content_publish",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      async request({ params, provider }: { params: Record<string, string>; provider: { clientId: string; clientSecret: string; callbackUrl: string } }) {
        const body = new URLSearchParams({
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          grant_type: "authorization_code",
          redirect_uri: provider.callbackUrl,
          code: params.code!,
        });

        const response = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Instagram token exchange failed: ${error}`);
        }

        const tokens = await response.json();

        // Exchange short-lived token for long-lived token (60 days)
        const longLivedResponse = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${provider.clientSecret}&access_token=${tokens.access_token}`
        );

        if (longLivedResponse.ok) {
          const longLived = await longLivedResponse.json();
          return {
            tokens: {
              access_token: longLived.access_token,
              token_type: longLived.token_type || "bearer",
              expires_at: longLived.expires_in
                ? Math.floor(Date.now() / 1000) + longLived.expires_in
                : undefined,
            },
          };
        }

        return {
          tokens: {
            access_token: tokens.access_token,
            token_type: "bearer",
          },
        };
      },
    },
    userinfo: {
      url: "https://graph.instagram.com/me",
      params: { fields: "user_id,username,name,profile_picture_url" },
    },
    profile(profile: Record<string, unknown>) {
      return {
        id: profile.user_id as string,
        name: (profile.name as string) || (profile.username as string),
        email: null,
        image: profile.profile_picture_url as string | undefined,
      };
    },
    clientId: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    InstagramLogin(),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "instagram") {
        token.instagramAccessToken = account.access_token;
        token.instagramUserId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (token.instagramAccessToken) {
        session.user.instagramAccessToken = token.instagramAccessToken as string;
        session.user.instagramUserId = token.instagramUserId as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "instagram" && profile) {
        const igUsername = (profile as Record<string, unknown>).username as string | undefined;
        if (igUsername && user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { instagramUsername: igUsername },
          }).catch(() => {
            // User might not exist yet during first sign-in (adapter creates them)
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
});
