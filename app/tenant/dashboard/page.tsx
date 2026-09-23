import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return <p>Chưa đăng nhập</p>;
  }

  const handleLogout = async () => {
    "use server";

    await signOut({
      redirectTo: "/public/auth/login",
    });
  };

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Tenant - Dashboard</h1>

      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>ID: {session.user.id}</p>

      <form action={handleLogout}>
        <Button type="submit" className="mt-5">
          Đăng xuất
        </Button>
      </form>
    </main>
  );
}
