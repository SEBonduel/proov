import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { setRole } from "@/lib/actions";
import { Reveal } from "@/components/Reveal";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role) redirect(user.role === "CANDIDATE" ? "/me" : "/");

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <div className="text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Bienvenue sur Proov 👋</h1>
          <p className="mt-2 text-slate-400">Vous êtes…</p>
        </div>
      </Reveal>

      <form action={setRole} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Reveal>
          <button
            type="submit"
            name="role"
            value="CANDIDATE"
            className="h-full w-full rounded-2xl p-6 text-left panel panel-hover"
          >
            <div className="text-3xl">💻</div>
            <h2 className="mt-3 font-semibold">Candidat·e</h2>
            <p className="mt-1 text-sm text-slate-400">
              Connectez votre GitHub : Proov analyse votre code et révèle vos
              compétences prouvées. Découvrez les offres où vous matchez.
            </p>
          </button>
        </Reveal>
        <Reveal delay={0.06}>
          <button
            type="submit"
            name="role"
            value="RECRUITER"
            className="h-full w-full rounded-2xl p-6 text-left panel panel-hover"
          >
            <div className="text-3xl">👔</div>
            <h2 className="mt-3 font-semibold">Recruteur·se</h2>
            <p className="mt-1 text-sm text-slate-400">
              Publiez des offres et obtenez un classement de candidats par preuve
              de compétence, avec un score explicable.
            </p>
          </button>
        </Reveal>
      </form>
    </div>
  );
}
