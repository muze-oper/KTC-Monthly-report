import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "muze.co.th";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
    },
  },
});
