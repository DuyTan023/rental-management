import { prisma } from "@/lib/prisma";


export type PaymentAccountInput = {
  provider: string;
  account_number: string;
  account_name: string;
  branch?: string | null;
  qr_image_url?: string | null;
  note?: string | null;
  is_active?: boolean;
  is_default?: boolean;
};

const accountSelect = {
  id: true,
  provider: true,
  account_number: true,
  account_name: true,
  branch: true,
  qr_image_url: true,
  note: true,
  is_active: true,
  is_default: true,
  created_at: true,
  updated_at: true,
};

export const paymentAccountRepository = {
  findAll() {
    return prisma.payment_accounts.findMany({
      select: accountSelect,
      orderBy: [
        { is_default: "desc" },
        { created_at: "desc" },
      ],
    });
  },

  findActive() {
    return prisma.payment_accounts.findMany({
      where: { is_active: true },
      select: accountSelect,
      orderBy: [
        { is_default: "desc" },
        { created_at: "desc" },
      ],
    });
  },

  findById(id: bigint) {
    return prisma.payment_accounts.findUnique({
      where: { id },
      select: accountSelect,
    });
  },

  create(input: PaymentAccountInput) {
    return prisma.$transaction(async () => {
      const isDefault = input.is_default ?? false;

      if (isDefault) {
        await prisma.payment_accounts.updateMany({
          where: { is_default: true },
          data: { is_default: false },
        });
      }

      return prisma.payment_accounts.create({
        data: {
          provider: input.provider,
          account_number: input.account_number,
          account_name: input.account_name,
          branch: input.branch || null,
          qr_image_url: input.qr_image_url || null,
          note: input.note || null,
          is_active: input.is_active ?? true,
          is_default: isDefault,
        },
        select: accountSelect,
      });
    });
  },

  update(id: bigint, input: Partial<PaymentAccountInput>) {
    return prisma.$transaction(async () => {
      const current = await prisma.payment_accounts.findUnique({
        where: { id },
      });

      if (!current) {
        throw new Error("Không tìm thấy tài khoản thanh toán.");
      }

      const nextActive = input.is_active ?? current.is_active;
      const nextDefault = input.is_default ?? current.is_default;

      if (!nextActive && nextDefault) {
        throw new Error(
          "Không thể đặt tài khoản mặc định ở trạng thái ngừng hoạt động."
        );
      }

      if (nextDefault) {
        await prisma.payment_accounts.updateMany({
          where: {
            id: { not: id },
            is_default: true,
          },
          data: { is_default: false },
        });
      }

      return prisma.payment_accounts.update({
        where: { id },
        data: {
          ...(input.provider !== undefined && {
            provider: input.provider,
          }),
          ...(input.account_number !== undefined && {
            account_number: input.account_number,
          }),
          ...(input.account_name !== undefined && {
            account_name: input.account_name,
          }),
          ...(input.branch !== undefined && {
            branch: input.branch || null,
          }),
          ...(input.qr_image_url !== undefined && {
            qr_image_url: input.qr_image_url || null,
          }),
          ...(input.note !== undefined && {
            note: input.note || null,
          }),
          is_active: nextActive,
          is_default: nextDefault,
          updated_at: new Date(),
        },
        select: accountSelect,
      });
    });
  },

  deactivate(id: bigint) {
    return prisma.payment_accounts.update({
      where: { id },
      data: {
        is_active: false,
        is_default: false,
        updated_at: new Date(),
      },
      select: accountSelect,
    });
  },
};
