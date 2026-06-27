import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Avatar } from "@/components/match-ui";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proov — le recrutement par la preuve du code",
  description:
    "Proov classe les candidats pour vos offres à partir de compétences vérifiées dans leur code GitHub, avec un score explicable.",
};

const navLink =
  "rounded-md px-3 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-emerald-300";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08080c]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </span>
              <span className="font-mono text-sm text-slate-400">
                <span className="font-semibold text-slate-100">proov</span>
                <span className="text-emerald-400"> ~</span> matching
              </span>
            </Link>

            <nav className="flex items-center gap-1 font-mono text-sm">
              <Link href="/" className={navLink}>Offres</Link>
              <Link href="/candidates" className={navLink}>Candidats</Link>
              {user?.role === "CANDIDATE" ? (
                <Link href="/me" className={navLink}>Mon profil</Link>
              ) : null}

              {user ? (
                <div className="ml-2 flex items-center gap-2.5 border-l border-white/10 pl-3">
                  <Avatar name={user.name ?? "?"} seed={user.email ?? user.name ?? "u"} size={28} />
                  <span className="hidden text-xs text-slate-400 sm:inline">
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
                    <button className={navLink} type="submit">↩</button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 rounded-lg bg-emerald-400 px-3 py-1.5 font-semibold text-emerald-950 transition hover:bg-emerald-300"
                >
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>

        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-5 text-center font-mono text-xs text-slate-600">
            proov — la preuve par le code, pas les promesses du CV.
          </div>
        </footer>
      </body>
    </html>
  );
}
