import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return <p>Chưa đăng nhập</p>;
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <p>Email: {session.user.email}</p>

      <p>Role: {session.user.role}</p>

      <p>ID: {session.user.id}</p>
    </main>
  );
}
