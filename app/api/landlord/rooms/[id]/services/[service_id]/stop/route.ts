// api/app/landlord/rooms/[id]/services/[service_id]/prices/route.ts
// Ngừng áp dụng dịch vụ cho các phòng

import type { NextRequest } from "next/server";
import { roomServiceRouteContext } from "../route";

export async function PATCH(req: NextRequest, {params}: roomServiceRouteContext) {
  try {
    const { id, service_id } = await params; // Lấy Id phòng và ID dịch vụ để tìm trong

  } catch (error) {}
}
