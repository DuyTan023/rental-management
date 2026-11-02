import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { services } from "@/generated/prisma/client";
import CardService from "@/lib/components/landlord/services/CardService";

type ServicesResponse = {
  success: boolean;
  message: string;
  data: services[];
};

function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách dịch vụ...
        </p>
      </div>
    </div>
  );
}

async function ServiceContent() {
  try {
    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      throw new Error("Chưa cấu hình APP_URL");
    }

    const res = await fetch(`${appUrl}/api/landlord/services`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Không thể lấy danh sách dịch vụ");
    }

    const result: ServicesResponse = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Không thể lấy danh sách dịch vụ");
    }

    return <CardService services={result.data} />;
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-destructive">
          Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }
}

export default function ServicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ServiceContent />
    </Suspense>
  );
}