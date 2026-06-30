import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { Reveal } from "@/components/Reveal";
import { OnboardingChoice } from "@/components/OnboardingChoice";

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

      <OnboardingChoice />
    </div>
  );
}
