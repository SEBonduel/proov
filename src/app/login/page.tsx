import Link from "next/link";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { CredentialsForm } from "@/components/CredentialsForm";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";

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
                <GitHubSignInButton label="Se connecter avec GitHub" />
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
