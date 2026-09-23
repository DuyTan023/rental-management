import { auth } from "@/auth";
import { redirect } from "next/navigation";
export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/public/auth/login");
  }

  if (session.user.role === "LANDLORD") {
    redirect("/landlord/dashboard");
  }

  if (session.user.role === "TENANT") {
    redirect("/tenant/dashboard");
  }

  redirect("/public/auth/login");
}
