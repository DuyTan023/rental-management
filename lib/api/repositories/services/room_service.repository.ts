// Thêm dịch vụ vào phòng
// Lấy dịch vụ và giá của phòng hỗ trợ lọc theo ngày áp dụng
// Cập nhật giá riêng của phòng
// Ngừng áp đụng dịch vụ cho phòng

import type { Prisma, room_services } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Áp dụng dịch vụ cho các phòng ddc chọn hay tất cả các phòng
export const roomServiceRepository = {
  // Thêm mới dịch vụ vào phòng
  createRoomService: async (
    input: Prisma.room_servicesCreateInput,
  ): Promise<room_services> => {
    return prisma.room_services.create({
      data: input,
    });
  },

  // Lấy dịch vụ và giá dịch vụ của phòng có hỗ trợ lọc theo ngày áp dụng
  findByRoomId: async (
    room_id: bigint,
    service_id: bigint,
    date: Date, // Ngày cần tính hóa đơn
  ): Promise<room_services | null> => {
    return prisma.room_services.findFirst({
      where: {
        room_id,
        service_id,
        effective_to: {
          lte: date, // Ngày bắt đầu áp dụng phải <= ngày kiểm tra
        },
        OR: [{ effective_to: null }, { effective_to: { gte: date } }], // chưa xác định đc ngày két thúc áp dụng giá hoặc ngày kết thúc >= ngày kiểm tra
      },
      orderBy: {
        effective_from: "desc",
      },
    });
  },

  // Cập nhật giá riêng cho phòng tại 1 thời điểm (xác định giá, ngày bắt đầu, ngày kết thúc)
  changeRoomServicePrice: async (
    room_id: bigint,
    service_id: bigint,
    new_unit_price: number, // Giá mới
    effective_from: Date, // Ngày áp dụng giá mới
  ): Promise<room_services> => {
    return prisma.$transaction(async (tx) => {
      // Tìm mức giá đang áp dụng cho dịch vụ của phòng
      const oldPrice = await tx.room_services.findFirst({
        where: {
          room_id,
          service_id,
          effective_to: null,
        },
        orderBy: {
          effective_from: "desc",
        },
      });

      // Không tìm thấy giá cũ thì không thể đổi giá
      if (!oldPrice) {
        throw new Error("Phòng chưa có dịch vụ này đang áp dụng.");
      }

      // Chuẩn hóa ngày về dạng DATE theo UTC
      const newStart = new Date(
        Date.UTC(
          effective_from.getUTCFullYear(),
          effective_from.getUTCMonth(),
          effective_from.getUTCDate(),
        ),
      );

      const oldStart = new Date(
        Date.UTC(
          oldPrice.effective_from.getUTCFullYear(),
          oldPrice.effective_from.getUTCMonth(),
          oldPrice.effective_from.getUTCDate(),
        ),
      );

      // Ngày đổi giá phải sau ngày bắt đầu của giá cũ
      if (newStart <= oldStart) {
        throw new Error(
          "Ngày áp dụng giá mới phải sau ngày bắt đầu áp dụng giá cũ.",
        );
      }

      // Tính ngày kết thúc của giá cũ
      const oldEnd = new Date(newStart);
      oldEnd.setUTCDate(oldEnd.getUTCDate() - 1);

      //Đóng thời gian áp dụng của giá cũ
      await tx.room_services.update({
        where: {
          id: oldPrice.id,
        },
        data: {
          effective_to: oldEnd,
        },
      });

      // Tạo bản ghi giá mới
      return tx.room_services.create({
        data: {
          room_id,
          service_id,
          unit_price: new_unit_price,
          effective_from: newStart,
          effective_to: null,
        },
      });
    });
  },

  // Ngừng áp dụng dịch vụ cho phòng
  stopRoomService: async (
    room_id: bigint,
    service_id: bigint,
    effective_to: Date,
  ): Promise<room_services> => {
    // Tìm bản ghi giá đang áp dụng
    const currentPrice = await prisma.room_services.findFirst({
      where: {
        room_id,
        service_id,
        effective_to: null,
      },
      orderBy: {
        effective_from: "desc",
      },
    });

    // Kiểm tra dịch vụ có đang áp dụng không
    if (!currentPrice) {
      throw new Error("Phòng không có dịch vụ này đang được áp dụng.");
    }

    // Chuẩn hóa ngày về dạng DATE theo UTC
    const endDate = new Date(
      Date.UTC(
        effective_to.getUTCFullYear(),
        effective_to.getUTCMonth(),
        effective_to.getUTCDate(),
      ),
    );

    const startDate = new Date(
      Date.UTC(
        currentPrice.effective_from.getUTCFullYear(),
        currentPrice.effective_from.getUTCMonth(),
        currentPrice.effective_from.getUTCDate(),
      ),
    );

    // Kiểm tra ngày ngừng áp dụng
    if (endDate < startDate) {
      throw new Error(
        "Ngày ngừng áp dụng không được trước ngày bắt đầu áp dụng.",
      );
    }

    // Cập nhật ngày kết thúc, không xóa bản ghi
    return prisma.room_services.update({
      where: {
        id: currentPrice.id,
      },
      data: {
        effective_to: endDate,
      },
    });
  },
};
