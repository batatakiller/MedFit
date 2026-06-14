import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PatientChat } from "@/components/ai/PatientChat";

export const metadata = { title: "Chat Med Fit" };
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  await requireAuth();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chat Med Fit"
        subtitle="Converse sobre dúvidas usando seus dados cruzados de forma protegida."
      />
      <PatientChat />
    </div>
  );
}
