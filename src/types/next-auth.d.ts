import type { DefaultSession } from "next-auth";

type AppRole = "CANDIDATE" | "RECRUITER" | "ADMIN" | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      githubLogin: string | null;
    } & DefaultSession["user"];
  }

  // Champ ajouté par le provider GitHub (profile callback).
  interface User {
    githubLogin?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: AppRole;
    githubLogin?: string | null;
  }
}
