import { Prisma, profiles, users } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FindManyParams } from "@/lib/types/api.type";

type FindManyResultProfile = {
  profiles: profiles[];
  total: number;
};

export const profileRepository = {
  // Lấy danh sách người thuê có phân trang
  findMany: async ({
    page = 1,
    limit = 10,
    keyword,
  }: FindManyParams): Promise<FindManyResultProfile> => {
    const skip = (page - 1) * limit;

    // Điều kiện tìm kiếm theo email, họ tên, số cccd
    const where: Prisma.profilesWhereInput = keyword
      ? {
          OR: [
            {
              full_name: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              identity_number: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              users: {
                email: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {};

    const [profiles, total] = await prisma.$transaction([
      prisma.profiles.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
        include: {
          users: true,
        },
      }),
      prisma.profiles.count({
        where,
      }),
    ]);

    return { profiles, total };
  },

  // Tìm người dùng theo id
  findById: async (id: bigint): Promise<profiles | null> => {
    return prisma.profiles.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });
  },

  findByUserId: async (userId: bigint): Promise<profiles | null> => {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
    });
  },

  // Thêm mới 1 ng thuê + tạo ngay tài khoản ở trạng thái chưa kích hoạt

  createProfile: async (
    inputProfile: Prisma.profilesCreateInput,
    inputUser: Prisma.usersCreateInput,
  ): Promise<{ user: users; profile: profiles }> => {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: inputUser,
      });

      const profile = await tx.profiles.create({
        data: {
          ...inputProfile,
          users: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      return { user, profile };
    });

    return result;
  },

  // cập nhật thông tin người thuê
  updateProfile: async (
    id: bigint,
    input: Prisma.profilesUpdateInput,
  ): Promise<profiles> => {
    return prisma.profiles.update({
      where: { id },
      data: input,
    });
  },

  // Xóa người thuê người thuê
  deleteProfile: async (id: bigint): Promise<profiles> => {
    return prisma.profiles.delete({
      where: { id },
    });
  },

  // Cập nhật trạng thái tài khoản, thay đổi password, cạp nhật các thông tin cần thiết
  updateUser: async (
    id: bigint,
    input: Prisma.usersUpdateInput,
  ): Promise<users> => {
    return prisma.users.update({
      where: { id },
      data: input,
    });
  },
};
