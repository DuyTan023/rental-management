import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "LANDLORD" | "TENANT";
  }

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
  interface JWT {
    id: string;
    role: "LANDLORD" | "TENANT";
  }
}
