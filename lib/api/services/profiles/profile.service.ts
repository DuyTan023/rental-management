import { Prisma, profiles, type users } from "@/generated/prisma/client";
import type { PaginationResult } from "@/lib/types/api.type";
import { profileRepository } from "../../repositories/profiles/profiles.repository";

type GetProfileParams = {
  page?: number;
  limit?: number;
  keyword?: string;
};

export const profileService = {
  getProfile: async ({
    page = 1,
    limit = 10,
    keyword,
  }: GetProfileParams): Promise<PaginationResult<profiles>> => {
    try {
      const { profiles, total } = await profileRepository.findMany({
        page,
        limit,
        keyword,
      });

      return {
        data: profiles,
        total: total,
        page: page,
        limit: limit,
        totalPage: Math.ceil(total / limit),
      };
    } catch {
      throw new Error("SERVER_ERROR");
    }
  },

  getById: async (id: bigint): Promise<profiles> => {
    try {
      const profile = await profileRepository.findById(id);
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  getByUserId: async (userId: bigint): Promise<profiles> => {
    try {
      const profile = await profileRepository.findByUserId(userId);
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  createProfile: async (
    inputProfile: Prisma.profilesCreateInput,
    inputUser: Prisma.usersCreateInput,
  ): Promise<{ user: users; profile: profiles }> => {
    try {
      return await profileRepository.createProfile(inputProfile, inputUser);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("PROFILE_EXISTS");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  updateProfile: async (
    id: bigint,
    input: Prisma.profilesUpdateInput,
  ): Promise<profiles> => {
    try {
      return await profileRepository.updateProfile(id, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("PROFILE_EXISTS");
        }

        // lỗi không tìm thấy profile cần update
        if (error.code === "P2025") {
          throw new Error("PROFILE_NOT_FOUND");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },

  deleteProfile: async (id: bigint): Promise<profiles> => {
    try {
      return await profileRepository.deleteProfile(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi profile không tồn tại
        if (error.code === "P2025") {
          throw new Error("PROFILE_NOT_FOUND");
        }

        // lỗi đang được sử dụng
        if (error.code === "P2003") {
          throw new Error("PROFILE_IN_USE");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },

  updateUser: async (
    id: bigint,
    input: Prisma.usersUpdateInput,
  ): Promise<users> => {
    try {
      return await profileRepository.updateUser(id, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("USER_EXISTS");
        }

        // lỗi không tìm thấy user cần update
        if (error.code === "P2025") {
          throw new Error("USER_NOT_FOUND");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },
};
