import Link from "next/link";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { CredentialsForm } from "@/components/CredentialsForm";

const githubConfigured = Boolean(process.env.AUTH_GITHUB_ID);

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(session.user.role ? "/" : "/onboarding");

  return (
    <div className="mx-auto max-w-md">
      <Reveal>
        <div className="rounded-2xl p-8 panel">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="mt-2 text-sm text-slate-400">
            Connectez-vous pour publier des offres ou révéler vos compétences.
          </p>

          {githubConfigured ? (
            <>
              <form
                className="mt-6"
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/onboarding" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Se connecter avec GitHub
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-xs text-slate-600">ou</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          ) : null}

          <CredentialsForm mode="login" />

          <p className="mt-5 text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-emerald-300 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
