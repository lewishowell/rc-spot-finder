import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Shared Instagram OAuth token exchange + long-lived token logic.
 * Both personal and business providers use the same token endpoints.
 */
function instagramTokenRequest({ params, provider }: { params: Record<string, string>; provider: { clientId: string; clientSecret: string; callbackUrl: string } }) {
  return async function () {
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
  };
}

const instagramProfile = {
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
};

/**
 * Instagram Personal Login — works with any account type.
 * Scope: instagram_basic (read-only photo access)
 */
function InstagramPersonal() {
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
        scope: "instagram_basic",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      async request(ctx: { params: Record<string, string>; provider: { clientId: string; clientSecret: string; callbackUrl: string } }) {
        return instagramTokenRequest(ctx)();
      },
    },
    ...instagramProfile,
    clientId: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
  };
}

/**
 * Instagram Business Login — requires Business/Creator account.
 * Scope: instagram_business_basic + instagram_business_content_publish
 * Enables importing photos AND publishing spots to Instagram.
 */
function InstagramBusiness() {
  return {
    id: "instagram-business",
    name: "Instagram Business",
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
      async request(ctx: { params: Record<string, string>; provider: { clientId: string; clientSecret: string; callbackUrl: string } }) {
        return instagramTokenRequest(ctx)();
      },
    },
    ...instagramProfile,
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
    InstagramPersonal(),
    InstagramBusiness(),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Store Instagram access token for API calls (both personal and business providers)
      if (account?.provider === "instagram" || account?.provider === "instagram-business") {
        token.instagramAccessToken = account.access_token;
        token.instagramUserId = account.providerAccountId;
        token.instagramCanPublish = account.provider === "instagram-business";
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
        session.user.instagramCanPublish = token.instagramCanPublish as boolean;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // For Instagram sign-ins, save the username
      if ((account?.provider === "instagram" || account?.provider === "instagram-business") && profile) {
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
