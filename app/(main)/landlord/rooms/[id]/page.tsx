import { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import RoomDetail from "@/lib/components/landlord/rooms/RoomDetail";
import { ApiResponse } from "@/lib/types/api.type";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function roomDetail({ params }: PageProps) {
  // Lấy id
  const { id } = await params;

  // Gọi API
  const res = await fetch(`${process.env.APP_URL}/api/landlord/rooms/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <div>Không thể lấy thông tin phòng.</div>;
  }

  const result: ApiResponse<RoomWithCurrentContract> = await res.json();
  if (!result.data) {
    return <div>Không thể lấy thông tin phòng.</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 gap-y-4">
      <RoomDetail room={result.data} />
    </div>
  );
}
