
import { auth } from "@/auth";
import Header from "@/lib/components/public/tenant/Header";
import { redirect } from "next/navigation";


export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/public/auth/login");
  }

  if (session.user.role !== "TENANT") {
    redirect("/landlord/dashboard");
  }

  return (
      <div className="min-h-screen bg-slate-50">
          
      <Header email={session.user.email} />

      {children}
    </div>
  );
}
