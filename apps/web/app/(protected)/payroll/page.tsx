import { requireAny } from "@/lib/dal";
import { redirect } from "next/navigation";
import { PayrollPage } from "@/components/pages/payroll-page";

export default async function PayrollRoute() {
  const session = await requireAny();
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }
  return <PayrollPage />;
}
