import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getUnreadConversationCount } from "@/lib/queries";
import { Avatar } from "@/components/match-ui";
import { Logo } from "@/components/Logo";
import { CommandPalette } from "@/components/CommandPalette";
import { PaletteTrigger } from "@/components/PaletteTrigger";
import { SubmitButton } from "@/components/SubmitButton";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proov, le recrutement par la preuve du code",
  description:
    "Proov classe les candidats pour vos offres à partir de compétences vérifiées dans leur code GitHub, avec un score explicable.",
};

const navLink =
  "rounded-md px-3 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-emerald-300";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user ?? null;
  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";
  const unread = user ? await getUnreadConversationCount(user.id) : 0;

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08080c]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3.5">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            <nav className="flex items-center gap-0.5 font-mono text-sm sm:gap-1">
              <PaletteTrigger />
              <Link href="/" className={navLink}>Offres</Link>
              {isRecruiter ? (
                <Link href="/candidates" className={navLink}>Candidats</Link>
              ) : null}
              {isRecruiter ? (
                <Link href="/stats" className={navLink}>Stats</Link>
              ) : null}
              {user?.role === "CANDIDATE" ? (
                <Link href="/me" className={navLink}>Profil</Link>
              ) : null}
              {isRecruiter ? (
                <Link href={`/recruiters/${user!.id}`} className={navLink}>Profil</Link>
              ) : null}
              {user ? (
                <Link href="/messages" className={`relative ${navLink}`}>
                  Messages
                  {unread > 0 ? (
                    <span className="ml-1.5 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-950">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              ) : null}

              {user ? (
                <div className="ml-1 flex items-center gap-2 border-l border-white/10 pl-2 sm:ml-2 sm:pl-3">
                  <Avatar name={user.name ?? "?"} seed={user.email ?? user.name ?? "u"} size={28} />
                  <span className="hidden text-xs text-slate-400 md:inline">
                    {user.name}
                    {user.role ? (
                      <span className="ml-1 rounded bg-white/5 px-1 text-[10px] uppercase text-slate-500">
                        {user.role === "CANDIDATE" ? "candidat" : "recruteur"}
                      </span>
                    ) : null}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <SubmitButton
                      pendingText="Déconnexion…"
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-rose-300 disabled:opacity-60"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span className="hidden sm:inline">Déconnexion</span>
                    </SubmitButton>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-1 rounded-lg bg-emerald-400 px-3 py-1.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 sm:ml-2"
                >
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        </header>

        <CommandPalette />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>

        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-5 text-center font-mono text-xs text-slate-600">
            Proov. La preuve par le code, pas les promesses du CV.
          </div>
        </footer>
      </body>
    </html>
  );
}
