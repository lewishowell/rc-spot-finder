import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Instagram from "next-auth/providers/instagram";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Instagram({
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Store Instagram access token for API calls
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
      // For Instagram sign-ins, save the username
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
