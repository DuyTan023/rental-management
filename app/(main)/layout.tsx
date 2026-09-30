import Sidebar from "@/lib/components/public/Sidebar";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 min-w-0 p-0 m-0">{children}</main>
    </div>
  );
}
