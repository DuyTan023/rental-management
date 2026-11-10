
import { roomAssetRepository } from "@/lib/api/repositories/room-assets/room-asset.repository";
import {
  asset_condition,
  Prisma,
} from "@/generated/prisma/client";

type AuthUser = {
  id: string;
  role: string;
};

export class RoomAssetError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "RoomAssetError";
  }
}

type CreateRoomAssetInput = {
  name: string;
  description?: string | null;
  quantity?: number;
  condition?: asset_condition;
  purchase_date?: string | null;
  unit_price?: number | string | null;
  image_url?: string | null;
  note?: string | null;
};

type UpdateRoomAssetInput = Partial<CreateRoomAssetInput> & {
  is_active?: boolean;
};

function authorize(user: AuthUser, role: "LANDLORD" | "TENANT") {
  if (!user.id || !/^[1-9]\d*$/.test(user.id)) {
    throw new RoomAssetError("Thông tin tài khoản không hợp lệ", 401);
  }

  if (user.role !== role) {
    throw new RoomAssetError("Bạn không có quyền thực hiện chức năng này", 403);
  }
}

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new RoomAssetError("Ngày mua tài sản không hợp lệ", 400);
  }

  return date;
}

function parsePrice(
  value: number | string | null | undefined
): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new RoomAssetError("Đơn giá tài sản không hợp lệ", 400);
  }

  return new Prisma.Decimal(value);
}

function validateImageUrl(value: string | null | undefined) {
  if (value === undefined || value === null || value === "") return;

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new RoomAssetError("Đường dẫn hình ảnh không hợp lệ", 400);
  }
}

function validateText(
  value: string | null | undefined,
  field: string,
  maxLength: number
) {
  if (value != null && value.length > maxLength) {
    throw new RoomAssetError(`${field} không được vượt quá ${maxLength} ký tự`, 400);
  }
}

function validateQuantity(quantity: number | undefined) {
  if (
    quantity !== undefined &&
    (!Number.isInteger(quantity) || quantity < 1)
  ) {
    throw new RoomAssetError("Số lượng tài sản phải là số nguyên lớn hơn 0", 400);
  }
}

function validateCondition(value: asset_condition | undefined) {
  if (
    value !== undefined &&
    !Object.values(asset_condition).some((item) => item === value)
  ) {
    throw new RoomAssetError("Tình trạng tài sản không hợp lệ", 400);
  }
}

export const roomAssetService = {
  async getRoomAssets(user: AuthUser, roomId: bigint) {
    authorize(user, "LANDLORD");

    const room = await roomAssetRepository.findRoomById(roomId);

    if (!room) {
      throw new RoomAssetError("Không tìm thấy phòng", 404);
    }

    const assets = await roomAssetRepository.findByRoom(roomId, true);

    return {
      room,
      assets,
    };
  },

  async create(
    user: AuthUser,
    roomId: bigint,
    input: CreateRoomAssetInput
  ) {
    authorize(user, "LANDLORD");

    if (!input.name?.trim()) {
      throw new RoomAssetError("Vui lòng nhập tên tài sản", 400);
    }

    validateText(input.name.trim(), "Tên tài sản", 255);
    validateText(input.description, "Mô tả", 5000);
    validateText(input.note, "Ghi chú", 2000);
    validateQuantity(input.quantity);
    validateCondition(input.condition);
    validateImageUrl(input.image_url);

    const room = await roomAssetRepository.findRoomById(roomId);

    if (!room) {
      throw new RoomAssetError("Không tìm thấy phòng", 404);
    }

    const data: Prisma.room_assetsCreateInput = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      quantity: input.quantity ?? 1,
      condition: input.condition ?? asset_condition.GOOD,
      purchase_date: parseDate(input.purchase_date) ?? null,
      unit_price: parsePrice(input.unit_price) ?? null,
      image_url: input.image_url?.trim() || null,
      note: input.note?.trim() || null,
      rooms: {
        connect: { id: roomId },
      },
    };

    return roomAssetRepository.create(data);
  },

  async update(
    user: AuthUser,
    id: bigint,
    input: UpdateRoomAssetInput
  ) {
    authorize(user, "LANDLORD");

    const current = await roomAssetRepository.findById(id);

    if (!current) {
      throw new RoomAssetError("Không tìm thấy tài sản", 404);
    }

    if (input.name !== undefined && !input.name.trim()) {
      throw new RoomAssetError("Tên tài sản không được để trống", 400);
    }

    if (input.name !== undefined) validateText(input.name.trim(), "Tên tài sản", 255);
    if (input.description !== undefined) validateText(input.description, "Mô tả", 5000);
    if (input.note !== undefined) validateText(input.note, "Ghi chú", 2000);

    validateQuantity(input.quantity);
    validateCondition(input.condition);
    validateImageUrl(input.image_url);

    const data: Prisma.room_assetsUpdateInput = {};

    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.condition !== undefined) data.condition = input.condition;
    if (input.purchase_date !== undefined) {
      data.purchase_date = parseDate(input.purchase_date) ?? null;
    }
    if (input.unit_price !== undefined) {
      data.unit_price = parsePrice(input.unit_price) ?? null;
    }
    if (input.image_url !== undefined) data.image_url = input.image_url?.trim() || null;
    if (input.note !== undefined) data.note = input.note?.trim() || null;
    if (input.is_active !== undefined) data.is_active = input.is_active;

    if (Object.keys(data).length === 0) {
      throw new RoomAssetError("Không có thông tin nào được cập nhật", 400);
    }

    return roomAssetRepository.update(id, data);
  },

  async getTenantAssets(user: AuthUser) {
    authorize(user, "TENANT");

    const contract = await roomAssetRepository.findActiveTenantContract(
      BigInt(user.id)
    );

    if (!contract) {
      throw new RoomAssetError("Bạn không có hợp đồng thuê đang hoạt động", 404);
    }

    const rentalContract = contract.rental_contracts;
    const assets = await roomAssetRepository.findActiveAssetsByRoom(
      rentalContract.room_id
    );

    return {
      room: rentalContract.rooms,
      contract: {
        id: rentalContract.id,
        contract_number: rentalContract.contract_number,
      },
      assets,
    };
  },
};
