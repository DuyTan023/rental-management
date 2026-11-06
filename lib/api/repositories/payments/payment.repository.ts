
// import { Prisma } from "@/generated/prisma/client";
// import { prisma } from "@/lib/prisma";

// export const paymentRepository = {
//   // =====================================================
//   // LOCK INVOICE
//   // =====================================================

//   async lockInvoice(
//     tx: Prisma.TransactionClient,
//     invoiceId: bigint,
//   ) {
//     await tx.$queryRaw`
//       SELECT id
//       FROM invoices
//       WHERE id = ${invoiceId}
//       FOR UPDATE
//     `;

//     return tx.invoices.findUnique({
//       where: { id: invoiceId },
//     });
//   },

//   // =====================================================
//   // GET PAYMENT
//   // =====================================================

//   findById(id: bigint) {
//     return prisma.payments.findUnique({
//       where: { id },
//       include: {
//         invoices: true,
//         profiles: true,
//         users: true,
//       },
//     });
//   },

//   // =====================================================
//   // CHECK TENANT BELONGS TO INVOICE CONTRACT
//   // =====================================================

//   async findTenantOnInvoice(
//     invoiceId: bigint,
//     profileId: bigint,
//   ) {
//     return prisma.contract_tenants.findFirst({
//       where: {
//         profile_id: profileId,
//         rental_contracts: {
//           invoices: {
//             some: {
//               id: invoiceId,
//             },
//           },
//         },
//       },
//     });
//   },

//   // =====================================================
//   // GET PENDING PAYMENT TOTAL
//   // =====================================================

//   async getPendingAmount(
//     tx: Prisma.TransactionClient,
//     invoiceId: bigint,
//   ) {
//     const result = await tx.payments.aggregate({
//       where: {
//         invoice_id: invoiceId,
//         status: "PENDING",
//         payment_method: {
//           in: ["BANK_TRANSFER", "PAYOS"],
//         },
//       },
//       _sum: {
//         amount: true,
//       },
//     });

//     return result._sum.amount ?? new Prisma.Decimal(0);
//   },

//   // =====================================================
//   // CREATE CASH PAYMENT
//   // =====================================================

//   async createCashPayment(data: {
//     invoiceId: bigint;
//     amount: Prisma.Decimal;
//     createdBy: bigint;
//     note?: string | null;
//   }) {
//     return prisma.$transaction(async (tx) => {
//       const invoice = await this.lockInvoice(tx, data.invoiceId);

//       if (!invoice) {
//         throw new Error("Không tìm thấy hóa đơn");
//       }

//       if (invoice.status === "CANCELLED") {
//         throw new Error("Hóa đơn đã bị hủy");
//       }

//       if (invoice.status === "PAID") {
//         throw new Error("Hóa đơn đã được thanh toán đủ");
//       }

//       const pendingAmount = await this.getPendingAmount(
//         tx,
//         data.invoiceId,
//       );

//       const remainingAmount = invoice.total_amount
//         .minus(invoice.paid_amount)
//         .minus(pendingAmount);

//       if (data.amount.greaterThan(remainingAmount)) {
//         throw new Error(
//           "Số tiền nhận vượt quá số tiền còn có thể thanh toán",
//         );
//       }

//       const newPaidAmount = invoice.paid_amount.plus(data.amount);

//       const payment = await tx.payments.create({
//         data: {
//           invoice_id: data.invoiceId,
//           created_by: data.createdBy,
//           amount: data.amount,
//           payment_method: "CASH",
//           status: "SUCCESS",
//           payment_date: new Date(),
//           note: data.note ?? null,
//         },
//       });

//       const updatedInvoice = await tx.invoices.update({
//         where: { id: data.invoiceId },
//         data: {
//           paid_amount: newPaidAmount,
//           status: newPaidAmount.greaterThanOrEqualTo(
//             invoice.total_amount,
//           )
//             ? "PAID"
//             : "PARTIALLY_PAID",
//         },
//       });

//       return {
//         payment,
//         invoice: updatedInvoice,
//       };
//     });
//   },

//   // =====================================================
//   // CREATE BANK TRANSFER REQUEST
//   // =====================================================

//   async createBankTransferRequest(data: {
//     invoiceId: bigint;
//     payerProfileId: bigint;
//     amount: Prisma.Decimal;
//     transactionRef?: string | null;
//     paymentDate?: Date | null;
//     note?: string | null;
//   }) {
//     return prisma.$transaction(async (tx) => {
//       const invoice = await this.lockInvoice(tx, data.invoiceId);

//       if (!invoice) {
//         throw new Error("Không tìm thấy hóa đơn");
//       }

//       if (invoice.status === "CANCELLED") {
//         throw new Error("Hóa đơn đã bị hủy");
//       }

//       if (invoice.status === "PAID") {
//         throw new Error("Hóa đơn đã được thanh toán đủ");
//       }

//       const pendingAmount = await this.getPendingAmount(
//         tx,
//         data.invoiceId,
//       );

//       const remainingAmount = invoice.total_amount
//         .minus(invoice.paid_amount)
//         .minus(pendingAmount);

//       if (data.amount.greaterThan(remainingAmount)) {
//         throw new Error(
//           "Số tiền yêu cầu vượt quá số tiền còn có thể thanh toán",
//         );
//       }

//       return tx.payments.create({
//         data: {
//           invoice_id: data.invoiceId,
//           payer_profile_id: data.payerProfileId,
//           amount: data.amount,
//           payment_method: "BANK_TRANSFER",
//           status: "PENDING",
//           transaction_ref: data.transactionRef ?? null,
//           payment_date: data.paymentDate ?? new Date(),
//           note: data.note ?? null,
//         },
//       });
//     });
//   },

//   // =====================================================
//   // CONFIRM PAYMENT
//   // =====================================================

//   async confirmPayment(data: {
//     paymentId: bigint;
//     confirmedBy: bigint;
//   }) {
//     return prisma.$transaction(async (tx) => {
//       const currentPayment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!currentPayment) {
//         throw new Error("Không tìm thấy giao dịch");
//       }

//       const invoice = await this.lockInvoice(
//         tx,
//         currentPayment.invoice_id,
//       );

//       if (!invoice) {
//         throw new Error("Không tìm thấy hóa đơn");
//       }

//       // Đọc lại payment sau khi khóa hóa đơn
//       const payment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!payment || payment.status !== "PENDING") {
//         throw new Error(
//           "Giao dịch không còn ở trạng thái chờ xác nhận",
//         );
//       }

//       if (invoice.status === "CANCELLED") {
//         throw new Error("Không thể xác nhận hóa đơn đã hủy");
//       }

//       if (payment.payment_method !== "BANK_TRANSFER") {
//         throw new Error(
//           "Chỉ xác nhận được yêu cầu chuyển khoản thủ công",
//         );
//       }

//       const remainingAmount = invoice.total_amount.minus(
//         invoice.paid_amount,
//       );

//       if (payment.amount.greaterThan(remainingAmount)) {
//         throw new Error(
//           "Số tiền giao dịch vượt quá công nợ còn lại",
//         );
//       }

//       const newPaidAmount = invoice.paid_amount.plus(payment.amount);

//       const updatedPayment = await tx.payments.update({
//         where: { id: payment.id },
//         data: {
//           status: "SUCCESS",
//           created_by: data.confirmedBy,
//         },
//       });

//       const updatedInvoice = await tx.invoices.update({
//         where: { id: invoice.id },
//         data: {
//           paid_amount: newPaidAmount,
//           status: newPaidAmount.greaterThanOrEqualTo(
//             invoice.total_amount,
//           )
//             ? "PAID"
//             : "PARTIALLY_PAID",
//         },
//       });

//       return {
//         payment: updatedPayment,
//         invoice: updatedInvoice,
//       };
//     });
//   },

//   // =====================================================
//   // REJECT PAYMENT
//   // =====================================================

//   async rejectPayment(data: {
//     paymentId: bigint;
//     reason: string;
//   }) {
//     return prisma.$transaction(async (tx) => {
//       const currentPayment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!currentPayment) {
//         throw new Error("Không tìm thấy giao dịch");
//       }

//       await this.lockInvoice(tx, currentPayment.invoice_id);

//       const payment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!payment || payment.status !== "PENDING") {
//         throw new Error(
//           "Giao dịch không còn ở trạng thái chờ xử lý",
//         );
//       }

//       if (payment.payment_method !== "BANK_TRANSFER") {
//         throw new Error(
//           "Chỉ có thể từ chối yêu cầu chuyển khoản",
//         );
//       }

//       return tx.payments.update({
//         where: { id: payment.id },
//         data: {
//           status: "FAILED",
//           note: data.reason,
//         },
//       });
//     });
//   },

//   // =====================================================
//   // CANCEL PAYMENT REQUEST BY TENANT
//   // =====================================================

//   async cancelPaymentRequest(data: {
//     paymentId: bigint;
//     payerProfileId: bigint;
//   }) {
//     return prisma.$transaction(async (tx) => {
//       const currentPayment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!currentPayment) {
//         throw new Error("Không tìm thấy giao dịch");
//       }

//       await this.lockInvoice(tx, currentPayment.invoice_id);

//       const payment = await tx.payments.findUnique({
//         where: { id: data.paymentId },
//       });

//       if (!payment || payment.status !== "PENDING") {
//         throw new Error(
//           "Chỉ có thể hủy yêu cầu đang chờ xác nhận",
//         );
//       }

//       if (
//         payment.payment_method !== "BANK_TRANSFER" ||
//         payment.payer_profile_id !== data.payerProfileId
//       ) {
//         throw new Error("Bạn không có quyền hủy giao dịch này");
//       }

//       return tx.payments.update({
//         where: { id: payment.id },
//         data: {
//           status: "CANCELLED",
//         },
//       });
//     });
//     },
  
//   findProfileByUserId(userId: bigint) {
//     return prisma.profiles.findUnique({
//         where: {
//         user_id: userId,
//         },
//     });
//     },
// };

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const PAYMENT_METHOD = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

const INVOICE_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

type Tx = Prisma.TransactionClient;

function decimal(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value);
}

async function lockInvoice(tx: Tx, invoiceId: bigint) {
  await tx.$queryRaw`
    SELECT id
    FROM invoices
    WHERE id = ${invoiceId}
    FOR UPDATE
  `;
}

async function getInvoice(tx: Tx, invoiceId: bigint) {
  return tx.invoices.findUnique({
    where: { id: invoiceId },
  });
}

async function getPendingBankTransferAmount(
  tx: Tx,
  invoiceId: bigint,
) {
  const result = await tx.payments.aggregate({
    where: {
      invoice_id: invoiceId,
      payment_method: PAYMENT_METHOD.BANK_TRANSFER,
      status: PAYMENT_STATUS.PENDING,
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? new Prisma.Decimal(0);
}

async function getAvailableAmount(
  tx: Tx,
  invoiceId: bigint,
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
) {
  const pendingAmount = await getPendingBankTransferAmount(
    tx,
    invoiceId,
  );

  const remaining = decimal(invoice.total_amount).minus(
    decimal(invoice.paid_amount),
  );

  return remaining.minus(pendingAmount);
}

function getInvoiceStatus(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
  dueDate: Date,
) {
  if (paidAmount.greaterThanOrEqualTo(totalAmount)) {
    return INVOICE_STATUS.PAID;
  }

  if (new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0)) {
    return INVOICE_STATUS.OVERDUE;
  }

  if (paidAmount.greaterThan(0)) {
    return INVOICE_STATUS.PARTIALLY_PAID;
  }

  return INVOICE_STATUS.UNPAID;
}

async function updateInvoicePaidAmount(
  tx: Tx,
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
  paymentAmount: Prisma.Decimal,
) {
  const newPaidAmount = decimal(invoice.paid_amount).plus(paymentAmount);
  const totalAmount = decimal(invoice.total_amount);

  if (newPaidAmount.greaterThan(totalAmount)) {
    throw new Error("Số tiền thanh toán vượt quá tổng tiền hóa đơn.");
  }

  const status = getInvoiceStatus(
    totalAmount,
    newPaidAmount,
    invoice.due_date,
  );

  return tx.invoices.update({
    where: { id: invoice.id },
    data: {
      paid_amount: newPaidAmount,
      status,
    },
  });
}

export const paymentRepository = {
  // Tìm profile từ tài khoản đăng nhập.
  async findProfileByUserId(userId: bigint) {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
    });
  },

  // Kiểm tra người thuê có thuộc hợp đồng của hóa đơn không.
  async isTenantOnInvoice(
    profileId: bigint,
    invoiceId: bigint,
  ) {
    const invoice = await prisma.invoices.findFirst({
      where: {
        id: invoiceId,
        rental_contracts: {
          contract_tenants: {
            some: {
              profile_id: profileId,
              status: "ACTIVE",
            },
          },
        },
      },
      select: { id: true },
    });

    return Boolean(invoice);
  },

  // Người thuê gửi yêu cầu chuyển khoản.
  async createBankTransferRequest(input: {
    invoiceId: bigint;
    profileId: bigint;
    userId: bigint;
    amount: Prisma.Decimal;
    transactionRef: string;
    paymentDate: Date;
    proofImageUrl: string;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await lockInvoice(tx, input.invoiceId);

      const invoice = await getInvoice(tx, input.invoiceId);

      if (!invoice) {
        throw new Error("Không tìm thấy hóa đơn.");
      }

      if (invoice.status === INVOICE_STATUS.CANCELLED) {
        throw new Error("Hóa đơn đã bị hủy.");
      }

      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new Error("Hóa đơn đã được thanh toán đầy đủ.");
      }

      const isTenant = await tx.contract_tenants.findFirst({
        where: {
          profile_id: input.profileId,
          contract_id: invoice.contract_id,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (!isTenant) {
        throw new Error("Bạn không thuộc hợp đồng của hóa đơn này.");
      }

      const availableAmount = await getAvailableAmount(
        tx,
        input.invoiceId,
        invoice,
      );

      if (input.amount.greaterThan(availableAmount)) {
        throw new Error("Số tiền yêu cầu vượt quá số tiền còn có thể thanh toán.");
      }

      return tx.payments.create({
        data: {
          invoice_id: input.invoiceId,
          payer_profile_id: input.profileId,
          created_by: input.userId,
          amount: input.amount,
          payment_method: PAYMENT_METHOD.BANK_TRANSFER,
          status: PAYMENT_STATUS.PENDING,
          transaction_ref: input.transactionRef,
          payment_date: input.paymentDate,
          proof_image_url: input.proofImageUrl,
          note: input.note,
        },
      });
    });
  },

  // Chủ trọ ghi nhận tiền mặt.
  async createCashPayment(input: {
    invoiceId: bigint;
    landlordId: bigint;
    amount: Prisma.Decimal;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await lockInvoice(tx, input.invoiceId);

      const invoice = await getInvoice(tx, input.invoiceId);

      if (!invoice) {
        throw new Error("Không tìm thấy hóa đơn.");
      }

      if (invoice.status === INVOICE_STATUS.CANCELLED) {
        throw new Error("Hóa đơn đã bị hủy.");
      }

      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new Error("Hóa đơn đã được thanh toán đầy đủ.");
      }

      const availableAmount = await getAvailableAmount(
        tx,
        input.invoiceId,
        invoice,
      );

      if (input.amount.greaterThan(availableAmount)) {
        throw new Error(
          "Số tiền thu vượt quá số tiền còn lại sau khi trừ các yêu cầu chuyển khoản đang chờ.",
        );
      }

      const payment = await tx.payments.create({
        data: {
          invoice_id: input.invoiceId,
          created_by: input.landlordId,
          amount: input.amount,
          payment_method: PAYMENT_METHOD.CASH,
          status: PAYMENT_STATUS.SUCCESS,
          payment_date: new Date(),
          note: input.note,
        },
      });

      await updateInvoicePaidAmount(tx, invoice, input.amount);

      return payment;
    });
  },

  // Chủ trọ xác nhận giao dịch chuyển khoản.
  async confirmBankTransfer(paymentId: bigint) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.payments.findUnique({
        where: { id: paymentId },
        select: { invoice_id: true },
      });

      if (!existing) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      await lockInvoice(tx, existing.invoice_id);

      const payment = await tx.payments.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      if (payment.payment_method !== PAYMENT_METHOD.BANK_TRANSFER) {
        throw new Error("Chỉ hỗ trợ xác nhận giao dịch chuyển khoản.");
      }

      if (payment.status !== PAYMENT_STATUS.PENDING) {
        throw new Error("Giao dịch không còn ở trạng thái chờ xác nhận.");
      }

      const invoice = await getInvoice(tx, payment.invoice_id);

      if (!invoice || invoice.status === INVOICE_STATUS.CANCELLED) {
        throw new Error("Hóa đơn không tồn tại hoặc đã bị hủy.");
      }

      const remaining = decimal(invoice.total_amount).minus(
        decimal(invoice.paid_amount),
      );

      if (decimal(payment.amount).greaterThan(remaining)) {
        throw new Error("Số tiền giao dịch vượt quá số tiền còn phải thu.");
      }

      const updatedPayment = await tx.payments.update({
        where: { id: paymentId },
        data: {
          status: PAYMENT_STATUS.SUCCESS,
          rejection_reason: null,
        },
      });

      await updateInvoicePaidAmount(
        tx,
        invoice,
        decimal(payment.amount),
      );

      return updatedPayment;
    });
  },

  // Chủ trọ từ chối giao dịch.
  async rejectBankTransfer(
    paymentId: bigint,
    rejectionReason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.payments.findUnique({
        where: { id: paymentId },
        select: { invoice_id: true },
      });

      if (!existing) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      await lockInvoice(tx, existing.invoice_id);

      const payment = await tx.payments.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      if (payment.payment_method !== PAYMENT_METHOD.BANK_TRANSFER) {
        throw new Error("Chỉ hỗ trợ từ chối giao dịch chuyển khoản.");
      }

      if (payment.status !== PAYMENT_STATUS.PENDING) {
        throw new Error("Giao dịch không còn ở trạng thái chờ xác nhận.");
      }

      return tx.payments.update({
        where: { id: paymentId },
        data: {
          status: PAYMENT_STATUS.FAILED,
          rejection_reason: rejectionReason,
        },
      });
    });
  },

  // Người thuê hủy yêu cầu chuyển khoản của chính mình.
  async cancelBankTransferRequest(
    paymentId: bigint,
    profileId: bigint,
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.payments.findUnique({
        where: { id: paymentId },
        select: { invoice_id: true },
      });

      if (!existing) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      await lockInvoice(tx, existing.invoice_id);

      const payment = await tx.payments.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error("Không tìm thấy giao dịch.");
      }

      if (payment.payer_profile_id !== profileId) {
        throw new Error("Bạn không có quyền hủy giao dịch này.");
      }

      if (payment.payment_method !== PAYMENT_METHOD.BANK_TRANSFER) {
        throw new Error("Chỉ có thể hủy yêu cầu chuyển khoản.");
      }

      if (payment.status !== PAYMENT_STATUS.PENDING) {
        throw new Error("Chỉ có thể hủy giao dịch đang chờ xác nhận.");
      }

      return tx.payments.update({
        where: { id: paymentId },
        data: {
          status: PAYMENT_STATUS.CANCELLED,
        },
      });
    });
  },

  // Lấy giao dịch theo ID.
  async findPaymentById(paymentId: bigint) {
    return prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
      },
    });
  },

  // Lịch sử thanh toán của hóa đơn.
  async findPaymentsByInvoiceId(invoiceId: bigint) {
    return prisma.payments.findMany({
      where: { invoice_id: invoiceId },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },
};