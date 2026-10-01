import { auth } from "@/auth";
import Header from "@/lib/components/public/Header";
import Sidebar from "@/lib/components/public/Sidebar";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  // Chưa đăng nhập
  if (!session) {
    redirect("/public/auth/login");
  }

  // Đã đăng nhập nhưng không phải LANDLORD
  if (session.user.role !== "LANDLORD") {
    redirect("/"); // hoặc trang 403
  }
  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 min-w-0 p-0 m-0">
        <div className="w-full">
          <Header />
          {children}
        </div>
      </main>
    </div>
  );
}
