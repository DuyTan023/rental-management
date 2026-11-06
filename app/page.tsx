// import { Button } from "@/components/ui/button";
// import Link from "next/link";

// export default function Home() {
//   return (
//     <div className="flex flex-col gap-2 w-48 p-6">
//       <Link href="/public/auth/login">
//         {" "}
//         <Button className="bg-blue-500"> Đăng nhập </Button>{" "}
//       </Link>
//       <Link href="/landlord/dashboard">
//         {" "}
//         <Button className="bg-blue-500"> Dashboard landloard </Button>{" "}
//       </Link>
//       <Button className="bg-blue-500"> Dashboard tenant </Button>
//     </div>
//   );
// }


import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Chưa đăng nhập
  if (!session?.user?.id) {
    redirect("/public/auth/login");
  }

  // Đã đăng nhập: điều hướng theo role
  switch (session.user.role) {
    case "LANDLORD":
      redirect("/landlord/dashboard");

    case "TENANT":
      redirect("/tenant/dashboard");

    default:
      redirect("/public/auth/login");
  }
}