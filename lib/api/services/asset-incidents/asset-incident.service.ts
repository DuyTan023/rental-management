
import { assetIncidentRepository } from "@/lib/api/repositories/asset-incidents/asset-incident.repository";
import {
  incident_priority,
  incident_status,
  Prisma,
} from "@/generated/prisma/client";

type AuthUser = {
  id: string;
  role: string;
};

export class AssetIncidentError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AssetIncidentError";
  }
}

type CreateIncidentInput = {
  asset_id?: string | null;
  title: string;
  description: string;
  image_urls?: string[];
  priority?: string;
};

type IncidentFilters = {
  status?: string;
  priority?: string;
  room_id?: string;
  page?: number;
  limit?: number;
};

function authorize(
  user: AuthUser,
  role: "LANDLORD" | "TENANT"
) {
  if (!user.id || !/^[1-9]\d*$/.test(user.id)) {
    throw new AssetIncidentError("Thông tin tài khoản không hợp lệ", 401);
  }

  if (user.role !== role) {
    throw new AssetIncidentError(
      "Bạn không có quyền thực hiện chức năng này",
      403
    );
  }
}

function parseBigIntId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new AssetIncidentError("ID không hợp lệ", 400);
  }

  return BigInt(value);
}

function validateImages(images?: string[]) {
  if (images === undefined) return;

  if (!Array.isArray(images)) {
    throw new AssetIncidentError(
      "Danh sách hình ảnh không hợp lệ",
      400
    );
  }

  if (images.length > 10) {
    throw new AssetIncidentError(
      "Chỉ được gửi tối đa 10 hình ảnh",
      400
    );
  }

  for (const value of images) {
    if (typeof value !== "string" || !value.trim()) {
      throw new AssetIncidentError("URL hình ảnh không hợp lệ", 400);
    }

    try {
      const url = new URL(value);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error();
      }
    } catch {
      throw new AssetIncidentError("URL hình ảnh không hợp lệ", 400);
    }
  }
}

function validatePagination(page: number, limit: number) {
  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    throw new AssetIncidentError(
      "Thông tin phân trang không hợp lệ",
      400
    );
  }
}

function getPriority(value?: string): incident_priority {
  const priority = value ?? incident_priority.MEDIUM;

  if (
    !Object.values(incident_priority).some(
      (item) => item === priority
    )
  ) {
    throw new AssetIncidentError("Mức độ sự cố không hợp lệ", 400);
  }

  return priority as incident_priority;
}

function getStatus(value: string): incident_status {
  if (
    !Object.values(incident_status).some(
      (item) => item === value
    )
  ) {
    throw new AssetIncidentError("Trạng thái không hợp lệ", 400);
  }

  return value as incident_status;
}

export const assetIncidentService = {
  async createTenantIncident(
    user: AuthUser,
    input: CreateIncidentInput
  ) {
    authorize(user, "TENANT");

    if (!input.title?.trim()) {
      throw new AssetIncidentError("Vui lòng nhập tiêu đề sự cố", 400);
    }

    if (input.title.trim().length > 255) {
      throw new AssetIncidentError(
        "Tiêu đề không được vượt quá 255 ký tự",
        400
      );
    }

    if (!input.description?.trim()) {
      throw new AssetIncidentError("Vui lòng mô tả sự cố", 400);
    }

    if (input.description.trim().length > 5000) {
      throw new AssetIncidentError(
        "Mô tả không được vượt quá 5000 ký tự",
        400
      );
    }

    validateImages(input.image_urls);

    const priority = getPriority(input.priority);

    const userId = BigInt(user.id);

    const contract =
      await assetIncidentRepository.findActiveTenantContract(userId);

    if (!contract) {
      throw new AssetIncidentError(
        "Bạn không có hợp đồng thuê đang hoạt động",
        404
      );
    }

    const rentalContract = contract.rental_contracts;
    const roomId = rentalContract.room_id;

    let assetId: bigint | null = null;

    if (input.asset_id) {
      assetId = parseBigIntId(input.asset_id);

      const asset = await assetIncidentRepository.findRoomAsset(
        assetId,
        roomId
      );

      if (!asset) {
        throw new AssetIncidentError(
          "Tài sản không tồn tại hoặc không thuộc phòng đang thuê",
          404
        );
      }
    }

    const data: Prisma.asset_incidentsCreateInput = {
      title: input.title.trim(),
      description: input.description.trim(),
      image_urls: input.image_urls ?? [],
      priority,
      status: incident_status.PENDING,
      rooms: {
        connect: { id: roomId },
      },
      rental_contracts: {
        connect: { id: rentalContract.id },
      },
      users: {
        connect: { id: userId },
      },
      ...(assetId
        ? {
            room_assets: {
              connect: { id: assetId },
            },
          }
        : {}),
    };

    return assetIncidentRepository.create(data, userId);
  },

  // async getTenantIncidents(
  //   user: AuthUser,
  //   page = 1,
  //   limit = 10
  // ) {
  //   authorize(user, "TENANT");
  //   validatePagination(page, limit);

  //   const skip = (page - 1) * limit;

  //   return assetIncidentRepository.findTenantIncidents(
  //     BigInt(user.id),
  //     skip,
  //     limit
  //   );
  // },

  async getTenantIncidents(
    user: AuthUser,
    page = 1,
    limit = 10
  ) {
    authorize(user, "TENANT");
    validatePagination(page, limit);

    const userId = BigInt(user.id);
    const skip = (page - 1) * limit;

    const contracts =
      await assetIncidentRepository.findActiveTenantRoomIds(userId);

    const roomIds = [
      ...new Set(
        contracts.map(
          (item) => item.rental_contracts.room_id
        )
      ),
    ];

    if (roomIds.length === 0) {
      return {
        items: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    return assetIncidentRepository.findTenantIncidents(
      roomIds,
      skip,
      limit
    );
  },

  async getLandlordIncidents(
    user: AuthUser,
    filters: IncidentFilters
  ) {
    authorize(user, "LANDLORD");

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    validatePagination(page, limit);

    const where: Prisma.asset_incidentsWhereInput = {};

    if (filters.status) {
      where.status = getStatus(filters.status);
    }

    if (filters.priority) {
      where.priority = getPriority(filters.priority);
    }

    if (filters.room_id) {
      where.room_id = parseBigIntId(filters.room_id);
    }

    return assetIncidentRepository.findLandlordIncidents(
      where,
      (page - 1) * limit,
      limit
    );
  },

  // async getDetail(user: AuthUser, id: bigint) {
  //   if (!user.id || !/^[1-9]\d*$/.test(user.id)) {
  //     throw new AssetIncidentError("Vui lòng đăng nhập", 401);
  //   }

  //   if (user.role !== "LANDLORD" && user.role !== "TENANT") {
  //     throw new AssetIncidentError("Bạn không có quyền xem báo cáo", 403);
  //   }

  //   const incident = await assetIncidentRepository.findById(id);

  //   if (!incident) {
  //     throw new AssetIncidentError("Không tìm thấy báo cáo sự cố", 404);
  //   }

  //   if (
  //     user.role === "TENANT" &&
  //     incident.reported_by !== BigInt(user.id)
  //   ) {
  //     throw new AssetIncidentError(
  //       "Bạn không có quyền xem báo cáo này",
  //       403
  //     );
  //   }

  //   return incident;
  // },

  async getDetail(user: AuthUser, id: bigint) {
    if (!user.id || !/^[1-9]\d*$/.test(user.id)) {
      throw new AssetIncidentError("Vui lòng đăng nhập", 401);
    }

    if (user.role !== "LANDLORD" && user.role !== "TENANT") {
      throw new AssetIncidentError(
        "Bạn không có quyền xem báo cáo",
        403
      );
    }

    const incident = await assetIncidentRepository.findById(id);

    if (!incident) {
      throw new AssetIncidentError(
        "Không tìm thấy báo cáo sự cố",
        404
      );
    }

    if (user.role === "TENANT") {
      const contracts =
        await assetIncidentRepository.findActiveTenantRoomIds(
          BigInt(user.id)
        );

      const hasAccess = contracts.some(
        (item) =>
          item.rental_contracts.room_id === incident.room_id
      );

      if (!hasAccess) {
        throw new AssetIncidentError(
          "Bạn không có quyền xem báo cáo này",
          403
        );
      }
    }

    return incident;
  },

  async updateStatus(
    user: AuthUser,
    id: bigint,
    input: {
      status: string;
      note?: string;
    }
  ) {
    authorize(user, "LANDLORD");

    const newStatus = getStatus(input.status);

    const incident = await assetIncidentRepository.findById(id);

    if (!incident) {
      throw new AssetIncidentError("Không tìm thấy báo cáo sự cố", 404);
    }

    const terminalStatuses: incident_status[] = [
      incident_status.RESOLVED,
      incident_status.REJECTED,
      incident_status.CANCELLED,
    ];

    if (terminalStatuses.includes(incident.status)) {
      throw new AssetIncidentError(
        "Báo cáo đã kết thúc, không thể cập nhật",
        400
      );
    }

    if (incident.status === newStatus) {
      throw new AssetIncidentError("Trạng thái không thay đổi", 400);
    }

    const allowedTransitions: Record<
      incident_status,
      incident_status[]
    > = {
      PENDING: [
        incident_status.IN_PROGRESS,
        incident_status.REJECTED,
        incident_status.CANCELLED,
      ],
      IN_PROGRESS: [
        incident_status.RESOLVED,
        incident_status.CANCELLED,
      ],
      RESOLVED: [],
      REJECTED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[incident.status].includes(newStatus)) {
      throw new AssetIncidentError(
        "Không thể chuyển sang trạng thái này",
        400
      );
    }

    const statusesRequireNote: incident_status[] = [
      incident_status.REJECTED,
      incident_status.RESOLVED,
    ];

    if (
      statusesRequireNote.includes(newStatus) &&
      !input.note?.trim()
    ) {
      throw new AssetIncidentError(
        newStatus === incident_status.REJECTED
          ? "Vui lòng nhập lý do từ chối"
          : "Vui lòng nhập ghi chú xử lý",
        400
      );
    }

    if (input.note && input.note.trim().length > 2000) {
      throw new AssetIncidentError(
        "Ghi chú không được vượt quá 2000 ký tự",
        400
      );
    }

    const result = await assetIncidentRepository.updateStatus({
      id,
      updatedBy: BigInt(user.id),
      oldStatus: incident.status,
      newStatus,
      note: input.note?.trim(),
    });

    if (!result) {
      throw new AssetIncidentError(
        "Báo cáo vừa được cập nhật bởi người khác. Vui lòng tải lại",
        409
      );
    }

    return result;
  },
};
