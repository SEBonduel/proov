import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { LiveAnalyze } from "@/components/LiveAnalyze";
import { Reveal } from "@/components/Reveal";

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const user = await requireRole();
  if (user.role !== "CANDIDATE") redirect("/");
  const { login } = await searchParams;
  if (!login) redirect("/me");

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <div className="rounded-2xl p-7 panel">
          <LiveAnalyze login={login} />
        </div>
      </Reveal>
    </div>
  );
}
