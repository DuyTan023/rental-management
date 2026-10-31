import {
  contract_deposits,
  contract_tenants,
  Prisma,
  rental_contract_status,
  rental_contracts,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Type input cho contract_tenants (loại bỏ 2 trường quan hệ tự connect trong transaction)
export type ContractTenantInput = Omit<
  Prisma.contract_tenantsUncheckedCreateInput,
  "contract_id" | "profile_id"
>;

// Type input cho profiles (loại bỏ relation users và user_id để tránh xung đột khi connect)
export type CreateProfileInput = Omit<
  Prisma.profilesCreateInput,
  "users" | "user_id"
  >;

  

// Type lọc nâng cao định nghĩa theo sắp hết hạn và hết hạn
export type ExpirationFilter = "expiring_soon" | "expired";

// Kiểu dữ liệu bộ lọc nâng cao có phân trang
export type FindManyRentalContractParams = {
  page?: number;
  limit?: number;
  keyword?: string; // Mã hợp đồng, số phòng, tên/SĐT khách, email user
  status?: rental_contract_status; // Trạng thái hợp đồng
  startDateFrom?: string; // YYYY-MM-DD
  startDateTo?: string; // YYYY-MM-DD
  expirationFilter?: ExpirationFilter; //Bộ lọc sắp hết hạn và hết hạn
  expiringInDays?: number; // Mặc định 30 ngày
};

// Cấu trúc cho mỗi khách thuê tham gia hợp đồng
export type TenantItemInput = {
  // Nếu khách cũ đã từng thuê: Truyền profile_id đã có sẵn
  profile_id?: bigint;

  // Nếu khác mới: Truyền thông tin để tạo User + Profile mới
  inputUser?: Prisma.usersCreateInput;
  inputProfile?: CreateProfileInput;

  // Thông tin bổ sung trong hợp đồng (Ví dụ: Có phải đại diện không?, Ngày vào ở)
  is_representative?: boolean; // Người đại diện hợp đồng
  joined_at?: Date | string;
};

// Kiểu dữ liệu đầu vào khi tạo mới hợp đòng : thông tin cần có hợp đồng, mảng các đối tượng TenantItemInput chứa thông tin của N người thuê phòng tham gia vào hợp đồng này
export type CreateFullContractParams = {
  inputRentalContract: Prisma.rental_contractsUncheckedCreateInput;
  tenants: TenantItemInput[];
  deposit: {
    initial_amount: number;
    note?: string | null;
  };
};

// Type dữ liệu một hợp đồng kèm phòng và người thuê
export type RentalContractWithDetails =
  Prisma.rental_contractsGetPayload<{
    include: {
      rooms: true;
      contract_tenants: {
        include: {
          profiles: true;
        };
      };
    };
  }>;

  export type RentalContractWithDetailV2 =
  Prisma.rental_contractsGetPayload<{
    include: {
      rooms: true;
      contract_tenants: {
        include: {
          profiles: true;
        };
      };
      contract_deposits: true
    };
  }>;

// Type kết quả danh sách hợp đồng
type FindManyResultRentalContract = {
  rental_contracts: RentalContractWithDetails[];
  total: number;
};

export const rentalContractRepository = {
  // Tìm kiếm dạng danh sách, bộ lọc nâng cao, phân trang
  findMany: async ({
    page = 1,
    limit = 10,
    keyword,
    status,
    startDateFrom,
    startDateTo,
    expirationFilter,
    expiringInDays = 30,
  }: FindManyRentalContractParams): Promise<FindManyResultRentalContract> => {
    const skip = (page - 1) * limit;
    const searchKeyword = keyword?.trim();
    const andConditions: Prisma.rental_contractsWhereInput[] = [];

    // Tìm kiếm theo từ khóa
    if (searchKeyword) {
      andConditions.push({
        OR: [
          // Mã hợp đồng
          {
            contract_number: {
              contains: searchKeyword,
              mode: "insensitive",
            },
          },
          // Số phòng
          {
            rooms: {
              room_number: {
                contains: searchKeyword,
                mode: "insensitive",
              },
            },
          },
          // Thông tin người thuê (Tên, SĐT, Email)
          {
            contract_tenants: {
              some: {
                profiles: {
                  OR: [
                    {
                      full_name: {
                        contains: searchKeyword,
                        mode: "insensitive",
                      },
                    },
                    {
                      phone: {
                        contains: searchKeyword,
                        mode: "insensitive",
                      },
                    },
                    {
                      users: {
                        email: {
                          contains: searchKeyword,
                          mode: "insensitive",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    // Lọc theo trạng thái hợp đồng
    if (status) {
      andConditions.push({ status });
    }

    // Lọc theo khoảng thời gian Ngày bắt đầu (Chuẩn hóa múi giờ)
    if (startDateFrom || startDateTo) {
      const gteDate = startDateFrom ? new Date(startDateFrom) : undefined;
      const lteDate = startDateTo ? new Date(startDateTo) : undefined;

      if (gteDate) gteDate.setHours(0, 0, 0, 0);
      if (lteDate) lteDate.setHours(23, 59, 59, 999);

      andConditions.push({
        start_date: {
          ...(gteDate ? { gte: gteDate } : {}),
          ...(lteDate ? { lte: lteDate } : {}),
        },
      });
    }

    // Lọc nâng cao: Sắp hết hạn trong X ngày / Đã hết hạn
    if (expirationFilter === "expiring_soon") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfFuturePeriod = new Date();
      endOfFuturePeriod.setDate(startOfToday.getDate() + expiringInDays);
      endOfFuturePeriod.setHours(23, 59, 59, 999);

      andConditions.push({
        end_date: {
          gte: startOfToday,
          lte: endOfFuturePeriod,
        },
        status: status ?? "ACTIVE",
      });
    } else if (expirationFilter === "expired") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      andConditions.push({
        end_date: {
          lt: startOfToday,
        },
      });
    }

    const where: Prisma.rental_contractsWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [rental_contracts, total] = await prisma.$transaction([
      prisma.rental_contracts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          rooms: true,
          contract_tenants: {
            include: {
              profiles: true,
            },
          },
        },
      }),

      prisma.rental_contracts.count({
        where,
      }),
    ]);

    return { rental_contracts, total };
  },

  // Tìm theo ID
  findById: async (id: bigint): Promise<RentalContractWithDetailV2 | null> => {
    return prisma.rental_contracts.findUnique({
      where: { id },
      include: {
        rooms: true,
        contract_tenants: {
          include: {
            profiles: {
              include: {
                users: true,
              },
            },
          },
        },
        contract_deposits: true,
      },
    });
  },


  // Tạo mới 1 hợp đồng
createRentalContracts: async ({
  inputRentalContract,
  tenants,
  deposit,
}: CreateFullContractParams): Promise<{
  rental_contract: rental_contracts;
  contract_tenants: contract_tenants[];
  contract_deposit: contract_deposits;
}> => {
  return await prisma.$transaction(async (tx) => {
    // 1. Tạo hợp đồng thuê
    const rental_contract = await tx.rental_contracts.create({
      data: {
        ...inputRentalContract,
        room_id: BigInt(inputRentalContract.room_id),
        start_date: new Date(inputRentalContract.start_date),
        end_date: inputRentalContract.end_date
          ? new Date(inputRentalContract.end_date)
          : null,
        status: "DRAFT",
      },
    });

    const createdContractTenants: contract_tenants[] = [];

    // 2. Tạo danh sách người thuê
    for (const tenantItem of tenants) {
      let targetProfileId: bigint;

      if (tenantItem.profile_id) {
        // Khách cũ: sử dụng profile_id có sẵn
        targetProfileId = BigInt(tenantItem.profile_id);
      } else if (tenantItem.inputUser && tenantItem.inputProfile) {
        // Khách mới: tạo User
        const user = await tx.users.create({
          data: tenantItem.inputUser,
        });

        // Tạo Profile và liên kết với User
        const profile = await tx.profiles.create({
          data: {
            ...tenantItem.inputProfile,
            date_of_birth: tenantItem.inputProfile.date_of_birth
              ? new Date(tenantItem.inputProfile.date_of_birth)
              : null,
            users: {
              connect: { id: user.id },
            },
          },
        });

        targetProfileId = profile.id;
      } else {
        throw new Error(
          "Mỗi khách thuê phải có profile_id hoặc đủ thông tin User và Profile.",
        );
      }

      // Tạo liên kết người thuê với hợp đồng
      const contract_tenant = await tx.contract_tenants.create({
        data: {
          contract_id: rental_contract.id,
          profile_id: targetProfileId,
          joined_at: tenantItem.joined_at
            ? new Date(tenantItem.joined_at)
            : new Date(),
          role: tenantItem.is_representative
            ? "REPRESENTATIVE"
            : "MEMBER",
          status: "ACTIVE",
        },
      });

      createdContractTenants.push(contract_tenant);
    }

    // 3. Tạo khoản tiền cọc ban đầu
    // Luôn ở trạng thái NOT_RECEIVED
    const contract_deposit = await tx.contract_deposits.create({
      data: {
        contract_id: rental_contract.id,
        initial_amount: deposit.initial_amount,
        status: "NOT_RECEIVED",
        received_date: null,
        note: deposit.note || null,
      },
    });

    // 4. Trả kết quả
    return {
      rental_contract,
      contract_tenants: createdContractTenants,
      contract_deposit,
    };
  });
},

  // updateRentalContract: async (
  //   id: bigint,
  //   input: Prisma.rental_contractsUpdateInput,
  // ): Promise<RentalContractWithDetails> => {
  //   return prisma.rental_contracts.update({
  //     where: { id },
  //     data: input,
  //     include: {
  //       rooms: true,
  //       contract_tenants: {
  //         include: {
  //           profiles: true,
  //         }
  //       }
  //     }
  //   });
  // },

updateRentalContract: async (
  id: bigint,
  input: Prisma.rental_contractsUpdateInput,
  depositData?: Prisma.contract_depositsUpdateInput,
  transactionData?: Omit<
    Prisma.deposit_transactionsUncheckedCreateInput,
    "contract_deposit_id"
  >,
): Promise<RentalContractWithDetails> => {
  return prisma.$transaction(async (tx) => {
    // 1. Cập nhật trạng thái hợp đồng
    const updatedContract = await tx.rental_contracts.update({
      where: { id },
      data: input,
      include: {
        rooms: true,
        contract_tenants: {
          include: {
            profiles: true,
          },
        },
      },
    });

    // 2. Tìm thông tin tiền cọc của hợp đồng
    const depositContract = await tx.contract_deposits.findFirst({
      where: {
        contract_id: updatedContract.id,
      },
    });

    // 3. Cập nhật trạng thái tiền cọc
    if (depositData && depositContract) {
      await tx.contract_deposits.update({
        where: {
          id: depositContract.id,
        },
        data: depositData,
      });
    }

   // 4. Tạo lịch sử giao dịch tiền cọc
      if (transactionData && depositContract) {
        await tx.deposit_transactions.create({
          data: {
            ...transactionData,
            contract_deposit_id: depositContract.id,
          },
        });
      }
    return updatedContract;
  });
},

  deleteRentalContract: async (id: bigint): Promise<rental_contracts> => {
    return prisma.rental_contracts.delete({
      where: { id },
    });
  },
};
