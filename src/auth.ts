import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Auth.js (NextAuth v5). Deux moyens de connexion : GitHub OAuth, et
// email/mot de passe (hash bcrypt). Stratégie JWT (requise avec Credentials) ;
// le rôle et le login GitHub sont rafraîchis depuis la base à chaque requête.

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    GitHub({
      // Récupère le pseudo GitHub (login) pour pouvoir analyser le profil ensuite.
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubLogin: profile.login,
        };
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "password",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.id) token.uid = user.id;
      // Capture du login GitHub à la connexion OAuth.
      const ghLogin = (profile as { login?: unknown } | undefined)?.login;
      if (account?.provider === "github" && typeof ghLogin === "string" && token.uid) {
        await prisma.user
          .update({ where: { id: token.uid as string }, data: { githubLogin: ghLogin } })
          .catch(() => {});
      }
      // Rafraîchit rôle + login GitHub depuis la base (reflète l'onboarding).
      if (token.uid) {
        const u = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, githubLogin: true },
        });
        token.role = u?.role ?? null;
        token.githubLogin = u?.githubLogin ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as "CANDIDATE" | "RECRUITER" | "ADMIN" | null) ?? null;
        session.user.githubLogin = (token.githubLogin as string | null) ?? null;
      }
      return session;
    },
  },
});
