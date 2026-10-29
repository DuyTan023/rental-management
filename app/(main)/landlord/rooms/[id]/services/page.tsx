
import { RoomServiceWithService } from "@/lib/api/repositories/services/room_service.repository";
import RoomServiceManager from "@/lib/components/landlord/rooms/RoomServiceManager";
import { ApiResponse } from "@/lib/types/api.type";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoomServicesPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.APP_URL}/api/landlord/rooms/${id}/services/history`,
    {
      cache: "no-store",
    },
  );

  // Chỉ hiển thị lỗi khi API thực sự thất bại.
  if (!res.ok) {
    return (
      <div className="p-4">
        <p className="font-medium text-slate-700">
          Không thể tải danh sách dịch vụ.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Vui lòng thử tải lại trang.
        </p>
      </div>
    );
  }

  const result: ApiResponse<RoomServiceWithService[]> = await res.json();

  // Nếu API trả về danh sách rỗng, vẫn render giao diện quản lý.
  const roomServices = Array.isArray(result.data) ? result.data : null;

  if (roomServices === null) {
    return (
      <div className="p-4">
        <p className="font-medium text-slate-700">
          Không thể tải danh sách dịch vụ.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-5">
      <RoomServiceManager room_services={roomServices} />
    </div>
  );
}
