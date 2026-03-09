import { requireAny } from "@/lib/dal";
import { redirect } from "next/navigation";
import { ReportsPage } from "@/components/pages/reports-page";

export default async function ReportsRoute() {
  const session = await requireAny();
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }
  return <ReportsPage />;
}
