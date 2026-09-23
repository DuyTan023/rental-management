import "next-auth";
import "next-auth/jwt";

// Mở rộng các type có sẵn trong next-auth và next-auth/jwt
declare module "next-auth" {
  // Thêm 2 thuộc tính id và role vào User
  interface User {
    id: string;
    role: "LANDLORD" | "TENANT";
  }

  // có thể dùng session.user.id, ... sau khi dùng const session = await auth();
  interface Session {
    user: {
      id: string;
      role: "LANDLORD" | "TENANT";
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  // Thêm 2 thuộc tính id và role vào jwt
  interface JWT {
    id: string;
    role: "LANDLORD" | "TENANT";
  }
}
