import {
  RoomWithCurrentContract,
  RoomWithCurrentContractV2,
} from "@/lib/api/repositories/rooms/rooms.repository";

import RoomDetail from "@/lib/components/landlord/rooms/RoomDetail";
import { ApiResponse } from "@/lib/types/api.type";

type CurrentMeterReading = {
  meterType: "ELECTRICITY" | "WATER";
  currentValue: number;
  readingDate: string;
  source: "INITIAL_HANDOVER" | "MONTHLY_REPORT";
};

type CurrentReadingsResponse = {
  roomId: string;
  contractId: string;
  readings: CurrentMeterReading[];
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [roomRes, readingsRes] = await Promise.all([
    fetch(`${process.env.APP_URL}/api/landlord/rooms/${id}`, {
      cache: "no-store",
    }),

    fetch(
      `${process.env.APP_URL}/api/landlord/rooms/${id}/meter_readings`,
      {
        cache: "no-store",
      }
    ),
  ]);

  if (!roomRes.ok) {
    return <div>Không thể lấy thông tin phòng.</div>;
  }

  const roomResult: ApiResponse<RoomWithCurrentContract> =
    await roomRes.json();

  if (!roomResult.data) {
    return <div>Không thể lấy thông tin phòng.</div>;
  }

  let currentReadings: CurrentMeterReading[] = [];

  if (readingsRes.ok) {
    const readingsResult: ApiResponse<CurrentReadingsResponse> =
      await readingsRes.json();

    currentReadings =
      readingsResult.data?.readings ?? [];
  }

  return (
    <div className="gap-y-4 p-3 sm:p-4 md:p-5">
      <RoomDetail
        room={roomResult.data}
        currentReadings={currentReadings}
      />
    </div>
  );
}