
import { overnightStayRepository } from "@/lib/api/repositories/overnight-stay/overnight-stay.repository";

import {
  CreateOvernightStayInput,
  UpdateOvernightStayInput,
  validateOvernightStayInput,
} from "@/lib/utils/overnight-stay.validator";

import { notification_status } from "@/generated/prisma/client";

// ==========================================
// ERROR
// ==========================================

class OvernightStayError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "OvernightStayError";
  }
}

export { OvernightStayError };

type NotificationStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED";

function validatePagination(page: number, limit: number) {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new OvernightStayError(
      "Thông tin phân trang không hợp lệ",
      400
    );
  }
}

function validateStatus(status?: string): NotificationStatus | undefined {
  if (!status) return undefined;

  const allowed: NotificationStatus[] = [
    "PENDING",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!allowed.includes(status as NotificationStatus)) {
    throw new OvernightStayError(
      "Trạng thái thông báo không hợp lệ",
      400
    );
  }

  return status as NotificationStatus;
}

function validateId(id: bigint) {
  if (id <= 0) {
    throw new OvernightStayError(
      "ID thông báo không hợp lệ",
      400
    );
  }
}

export const overnightStayService = {
  // ==========================================
  // TENANT
  // ==========================================

  // Tạo thông báo khách ở qua đêm
  async create(
    userId: bigint,
    input: CreateOvernightStayInput
  ) {
    validateOvernightStayInput(input);

    if (userId <= 0) {
      throw new OvernightStayError(
        "Tài khoản không hợp lệ",
        401
      );
    }

    const profile =
      await overnightStayRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new OvernightStayError(
        "Không tìm thấy hồ sơ người thuê",
        404
      );
    }

    const contractId = BigInt(input.contract_id);

    const contract =
      await overnightStayRepository.findActiveContract(
        contractId,
        profile.id
      );

    if (!contract) {
      throw new OvernightStayError(
        "Bạn không có quyền thông báo lưu trú cho hợp đồng này",
        403
      );
    }

    const checkIn = new Date(input.check_in_at);
    const checkOut = new Date(input.check_out_at);

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    ) {
      throw new OvernightStayError(
        "Thời gian rời đi phải sau thời gian đến",
        400
      );
    }

    return overnightStayRepository.create({
      contract_id: contract.id,
      tenant_profile_id: profile.id,

      guest_name: input.guest_name.trim(),

      guest_identity_number:
        input.guest_identity_number?.trim() || null,

      guest_phone:
        input.guest_phone?.trim() || null,

      guest_address:
        input.guest_address?.trim() || null,

      check_in_at: checkIn,
      check_out_at: checkOut,

      note: input.note?.trim() || null,

      notification_status: "PENDING",
    });
  },

  // Danh sách thông báo của người thuê
  // async getMyList(
  //   userId: bigint,
  //   page = 1,
  //   limit = 10,
  //   rawStatus?: string
  // ) {
  //   validatePagination(page, limit);

  //   const status = validateStatus(rawStatus);

  //   const profile =
  //     await overnightStayRepository.findProfileByUserId(userId);

  //   if (!profile) {
  //     throw new OvernightStayError(
  //       "Không tìm thấy hồ sơ người thuê",
  //       404
  //     );
  //   }

  //   const skip = (page - 1) * limit;

  //   const [data, total, statistics] = await Promise.all([
  //     overnightStayRepository.findManyByTenant(
  //       profile.id,
  //       skip,
  //       limit,
  //       status
  //     ),

  //     overnightStayRepository.countByTenant(
  //       profile.id,
  //       status
  //     ),

  //     overnightStayRepository.getTenantStatistics(
  //       profile.id
  //     ),
  //   ]);

  //   return {
  //     data,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //     statistics,
  //   };
  // },

  async getMyList(
  userId: bigint,
  page = 1,
  limit = 10,
  rawStatus?: string
) {
  validatePagination(page, limit);

  if (userId <= 0) {
    throw new OvernightStayError(
      "Tài khoản không hợp lệ",
      401
    );
  }

  const status = validateStatus(rawStatus);

  const profile =
    await overnightStayRepository.findProfileByUserId(userId);

  if (!profile) {
    throw new OvernightStayError(
      "Không tìm thấy hồ sơ người thuê",
      404
    );
  }

  const contracts =
    await overnightStayRepository.findActiveTenantRoomIds(
      profile.id
    );

  const roomIds = [
    ...new Set(
      contracts.map(
        (item) => item.rental_contracts.room_id
      )
    ),
  ];

  if (roomIds.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      statistics: {
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
      },
    };
  }

  const skip = (page - 1) * limit;

  const [data, total, statistics] = await Promise.all([
    overnightStayRepository.findManyByTenant(
      roomIds,
      skip,
      limit,
      status
    ),

    overnightStayRepository.countByTenant(
      roomIds,
      status
    ),

    overnightStayRepository.getTenantStatistics(
      roomIds
    ),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    statistics,
  };
},

  // Chi tiết thông báo của người thuê
  // async getMyDetail(userId: bigint, id: bigint) {
  //   validateId(id);

  //   const profile =
  //     await overnightStayRepository.findProfileByUserId(userId);

  //   if (!profile) {
  //     throw new OvernightStayError(
  //       "Không tìm thấy hồ sơ người thuê",
  //       404
  //     );
  //   }

  //   const record =
  //     await overnightStayRepository.findByTenantId(
  //       id,
  //       profile.id
  //     );

  //   if (!record) {
  //     throw new OvernightStayError(
  //       "Không tìm thấy thông báo lưu trú",
  //       404
  //     );
  //   }

  //   return record;
  // },

  async getMyDetail(userId: bigint, id: bigint) {
  validateId(id);

  if (userId <= 0) {
    throw new OvernightStayError(
      "Tài khoản không hợp lệ",
      401
    );
  }

  const profile =
    await overnightStayRepository.findProfileByUserId(userId);

  if (!profile) {
    throw new OvernightStayError(
      "Không tìm thấy hồ sơ người thuê",
      404
    );
  }

  const contracts =
    await overnightStayRepository.findActiveTenantRoomIds(
      profile.id
    );

  const roomIds = [
    ...new Set(
      contracts.map(
        (item) => item.rental_contracts.room_id
      )
    ),
  ];

  if (roomIds.length === 0) {
    throw new OvernightStayError(
      "Không tìm thấy thông báo lưu trú",
      404
    );
  }

  const record =
    await overnightStayRepository.findByRoomIds(
      id,
      roomIds
    );

  if (!record) {
    throw new OvernightStayError(
      "Không tìm thấy thông báo lưu trú",
      404
    );
  }

  return record;
},

  // Chỉnh sửa thông báo
  async update(
    userId: bigint,
    id: bigint,
    input: UpdateOvernightStayInput
  ) {
    validateId(id);
    validateOvernightStayInput(input);

    const record = await this.getMyDetail(userId, id);
    const profile =
      await overnightStayRepository.findProfileByUserId(userId);

    if (!profile || record.tenant_profile_id !== profile.id) {
      throw new OvernightStayError(
        "Bạn không có quyền chỉnh sửa thông báo này",
        403
      );
    }

    if (record.notification_status !== "PENDING") {
      throw new OvernightStayError(
        "Chỉ được chỉnh sửa thông báo khi chủ trọ chưa xử lý",
        400
      );
    }

    const checkIn = new Date(input.check_in_at);
    const checkOut = new Date(input.check_out_at);

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    ) {
      throw new OvernightStayError(
        "Thời gian rời đi phải sau thời gian đến",
        400
      );
    }

    const updated =
      await overnightStayRepository.updateIfPending(
        id,
        record.tenant_profile_id,
        {
          guest_name: input.guest_name.trim(),

          guest_identity_number:
            input.guest_identity_number?.trim() || null,

          guest_phone:
            input.guest_phone?.trim() || null,

          guest_address:
            input.guest_address?.trim() || null,

          check_in_at: checkIn,
          check_out_at: checkOut,

          note: input.note?.trim() || null,
        }
      );

    if (!updated) {
      throw new OvernightStayError(
        "Thông báo đã được chủ trọ xử lý, không thể chỉnh sửa",
        409
      );
    }

    return updated;
  },

  // Hủy thông báo
  async cancel(userId: bigint, id: bigint) {
    validateId(id);

    const record = await this.getMyDetail(userId, id);

    const profile =
      await overnightStayRepository.findProfileByUserId(userId);

    if (!profile || record.tenant_profile_id !== profile.id) {
      throw new OvernightStayError(
        "Bạn không có quyền hủy thông báo này",
        403
      );
    }

    if (record.notification_status !== "PENDING") {
      throw new OvernightStayError(
        "Không thể hủy thông báo đã được chủ trọ xử lý",
        400
      );
    }

    const cancelled =
      await overnightStayRepository.cancelIfPending(
        id,
        record.tenant_profile_id
      );

    if (!cancelled) {
      throw new OvernightStayError(
        "Thông báo đã được xử lý, không thể hủy",
        409
      );
    }

    return cancelled;
  },

  // ==========================================
  // LANDLORD
  // ==========================================

  // Danh sách thông báo cho chủ trọ
  async getLandlordList(
    page = 1,
    limit = 10,
    rawStatus?: string
  ) {
    validatePagination(page, limit);

    const status = validateStatus(rawStatus);

    const skip = (page - 1) * limit;

    const [data, total, statistics] = await Promise.all([
      overnightStayRepository.findManyForLandlord(
        skip,
        limit,
        status
      ),

      overnightStayRepository.countForLandlord(
        status
      ),

      overnightStayRepository.getLandlordStatistics(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics,
    };
  },

  // Chi tiết thông báo cho chủ trọ
  async getLandlordDetail(id: bigint) {
    validateId(id);

    const record =
      await overnightStayRepository.findById(id);

    if (!record) {
      throw new OvernightStayError(
        "Không tìm thấy thông báo lưu trú",
        404
      );
    }

    return record;
  },

  // Chủ trọ xác nhận hoàn tất khai báo
  async completeNotification(
    id: bigint,
    landlordId: bigint
  ) {
    validateId(id);

    if (landlordId <= 0) {
      throw new OvernightStayError(
        "Tài khoản chủ trọ không hợp lệ",
        401
      );
    }

    const record = await this.getLandlordDetail(id);

    if (record.notification_status !== "PENDING") {
      throw new OvernightStayError(
        "Thông báo này đã được xử lý trước đó",
        400
      );
    }

    const completed =
      await overnightStayRepository.completeIfPending(
        id,
        landlordId
      );

    if (!completed) {
      throw new OvernightStayError(
        "Thông báo đã được xử lý trước đó",
        409
      );
    }

    return completed;
  },
};
