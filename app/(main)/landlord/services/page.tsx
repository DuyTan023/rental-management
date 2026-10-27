import type { services } from "@/generated/prisma/client";
import CardService from "@/lib/components/landlord/services/CardService";

type ServicesResponse = {
  success: boolean;
  message: string;
  data: services[];
};

export default async function ServicePage() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_APP_URL");
  }

  const res = await fetch(`${appUrl}/api/landlord/services`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách dịch vụ: ${res.status}`);
  }

  const result: ServicesResponse = await res.json();

  return (
    <div>
      <CardService services={result.data} />
    </div>
  );
}
