
// import { Prisma } from "@/generated/prisma/client";
// import { paymentRepository } from "@/lib/api/repositories/payments/payment.repository";

// type CreateCashPaymentInput = {
//   invoiceId: bigint;
//   amount: string;
//   landlordId: bigint;
//   note?: string;
// };

// type CreateBankTransferInput = {
//   invoiceId: bigint;
//   amount: string;
//   tenantId: bigint;
//   transactionRef?: string;
//   paymentDate?: string;
//   note?: string;
// };

// type RejectPaymentInput = {
//   paymentId: bigint;
//   reason: string;
// };

// export const paymentService = {
//   // =====================================================
//   // VALIDATE AMOUNT
//   // =====================================================

//   parseAmount(value: string): Prisma.Decimal {
//     const normalized = value.trim();

//     // Chỉ chấp nhận số dương, tối đa 2 chữ số thập phân
//     if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
//       throw new Error("Số tiền không hợp lệ");
//     }

//     let amount: Prisma.Decimal;

//     try {
//       amount = new Prisma.Decimal(normalized);
//     } catch {
//       throw new Error("Số tiền không hợp lệ");
//     }

//     if (!amount.isFinite() || !amount.greaterThan(0)) {
//       throw new Error("Số tiền phải lớn hơn 0");
//     }

//     return amount;
//   },

//   // =====================================================
//   // CREATE CASH PAYMENT
//   // LANDLORD
//   // =====================================================

//   async createCashPayment(input: CreateCashPaymentInput) {
//     const amount = this.parseAmount(input.amount);

//     return paymentRepository.createCashPayment({
//       invoiceId: input.invoiceId,
//       amount,
//       createdBy: input.landlordId,
//       note: input.note?.trim() || null,
//     });
//   },

//   // =====================================================
//   // CREATE BANK TRANSFER REQUEST
//   // TENANT
//   // =====================================================

//   async createBankTransferRequest(
//     input: CreateBankTransferInput,
//   ) {
//     const amount = this.parseAmount(input.amount);

//     // Lấy hồ sơ từ tài khoản đăng nhập
//     const profile = await paymentRepository.findProfileByUserId(
//       input.tenantId,
//     );

//     if (!profile) {
//       throw new Error("Không tìm thấy hồ sơ người thuê");
//     }

//     // Kiểm tra người thuê có thuộc hợp đồng của hóa đơn
//     const tenant = await paymentRepository.findTenantOnInvoice(
//       input.invoiceId,
//       profile.id,
//     );

//     if (!tenant) {
//       throw new Error(
//         "Bạn không có quyền thanh toán hóa đơn này",
//       );
//     }

//     let paymentDate: Date | null = null;

//     if (input.paymentDate) {
//       paymentDate = new Date(input.paymentDate);

//       if (Number.isNaN(paymentDate.getTime())) {
//         throw new Error("Ngày chuyển khoản không hợp lệ");
//       }

//       // Không cho khai báo ngày chuyển khoản trong tương lai
//       if (paymentDate.getTime() > Date.now()) {
//         throw new Error(
//           "Ngày chuyển khoản không được ở tương lai",
//         );
//       }
//     }

//     const transactionRef = input.transactionRef?.trim() || null;

//     if (transactionRef && transactionRef.length > 150) {
//       throw new Error(
//         "Mã giao dịch không được vượt quá 150 ký tự",
//       );
//     }

//     const note = input.note?.trim() || null;

//     if (note && note.length > 1000) {
//       throw new Error("Ghi chú không được vượt quá 1000 ký tự");
//     }

//     return paymentRepository.createBankTransferRequest({
//       invoiceId: input.invoiceId,
//       payerProfileId: profile.id,
//       amount,
//       transactionRef,
//       paymentDate,
//       note,
//     });
//   },

//   // =====================================================
//   // CONFIRM PAYMENT
//   // LANDLORD
//   // =====================================================

//   async confirmPayment(
//     paymentId: bigint,
//     landlordId: bigint,
//   ) {
//     return paymentRepository.confirmPayment({
//       paymentId,
//       confirmedBy: landlordId,
//     });
//   },

//   // =====================================================
//   // REJECT PAYMENT
//   // LANDLORD
//   // =====================================================

//   async rejectPayment(input: RejectPaymentInput) {
//     const reason = input.reason.trim();

//     if (!reason) {
//       throw new Error("Vui lòng nhập lý do từ chối");
//     }

//     if (reason.length > 1000) {
//       throw new Error(
//         "Lý do từ chối không được vượt quá 1000 ký tự",
//       );
//     }

//     return paymentRepository.rejectPayment({
//       paymentId: input.paymentId,
//       reason,
//     });
//   },

//   // =====================================================
//   // CANCEL PAYMENT REQUEST
//   // TENANT
//   // =====================================================

//   async cancelPaymentRequest(
//     paymentId: bigint,
//     tenantId: bigint,
//   ) {
//     const profile = await paymentRepository.findProfileByUserId(
//       tenantId,
//     );

//     if (!profile) {
//       throw new Error("Không tìm thấy hồ sơ người thuê");
//     }

//     return paymentRepository.cancelPaymentRequest({
//       paymentId,
//       payerProfileId: profile.id,
//     });
//   },
// };


import { Prisma } from "@/generated/prisma/client";
import { paymentRepository } from "@/lib/api/repositories/payments/payment.repository";

function parseAmount(value: unknown): Prisma.Decimal {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    throw new Error("Số tiền thanh toán không hợp lệ.");
  }

  const raw = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("Số tiền phải lớn hơn 0 và có tối đa 2 chữ số thập phân.");
  }

  const amount = new Prisma.Decimal(raw);

  if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
    throw new Error("Số tiền thanh toán phải lớn hơn 0.");
  }

  return amount;
}

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error("ID không hợp lệ.");
  }

  return BigInt(value);
}

function parsePaymentDate(value: unknown): Date {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Vui lòng cung cấp ngày chuyển khoản.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Ngày chuyển khoản không hợp lệ.");
  }

  if (date.getTime() > Date.now()) {
    throw new Error("Ngày chuyển khoản không được ở tương lai.");
  }

  return date;
}

function validateText(
  value: unknown,
  fieldName: string,
  maxLength: number,
  required = false,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error(`${fieldName} không được để trống.`);
    }

    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} không hợp lệ.`);
  }

  const result = value.trim();

  if (required && !result) {
    throw new Error(`${fieldName} không được để trống.`);
  }

  if (result.length > maxLength) {
    throw new Error(`${fieldName} không được vượt quá ${maxLength} ký tự.`);
  }

  return result || undefined;
}

function validateProofImageUrl(value: unknown): string {
  const url = validateText(
    value,
    "Ảnh xác nhận chuyển khoản",
    500,
    true,
  );

  let parsed: URL;

  try {
    parsed = new URL(url!);
  } catch {
    throw new Error("Đường dẫn ảnh không hợp lệ.");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "res.cloudinary.com"
  ) {
    throw new Error("Ảnh xác nhận phải được tải lên Cloudinary.");
  }

  return url!;
}

export const paymentService = {
  async createBankTransferRequest(input: {
    invoiceId: string;
    userId: string;
    body: {
      amount: unknown;
      transaction_ref: unknown;
      payment_date: unknown;
      proof_image_url: unknown;
      note?: unknown;
    };
  }) {
    const invoiceId = parseId(input.invoiceId);
    const userId = parseId(input.userId);

    const profile = await paymentRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new Error("Không tìm thấy hồ sơ người thuê.");
    }

    const transactionRef = validateText(
      input.body.transaction_ref,
      "Mã giao dịch",
      150,
      true,
    );

    const note = validateText(
      input.body.note,
      "Ghi chú",
      1000,
    );

    const amount = parseAmount(input.body.amount);
    const paymentDate = parsePaymentDate(input.body.payment_date);
    const proofImageUrl = validateProofImageUrl(
      input.body.proof_image_url,
    );

    return paymentRepository.createBankTransferRequest({
      invoiceId,
      profileId: profile.id,
      userId,
      amount,
      transactionRef: transactionRef!,
      paymentDate,
      proofImageUrl,
      note,
    });
  },

  async createCashPayment(input: {
    invoiceId: string;
    landlordId: string;
    body: {
      amount: unknown;
      note?: unknown;
    };
  }) {
    const invoiceId = parseId(input.invoiceId);
    const landlordId = parseId(input.landlordId);
    const amount = parseAmount(input.body.amount);

    const note = validateText(
      input.body.note,
      "Ghi chú",
      1000,
    );

    return paymentRepository.createCashPayment({
      invoiceId,
      landlordId,
      amount,
      note,
    });
  },

  async confirmBankTransfer(paymentId: string) {
    return paymentRepository.confirmBankTransfer(
      parseId(paymentId),
    );
  },

  async rejectBankTransfer(
    paymentId: string,
    reason: unknown,
  ) {
    const rejectionReason = validateText(
      reason,
      "Lý do từ chối",
      1000,
      true,
    );

    return paymentRepository.rejectBankTransfer(
      parseId(paymentId),
      rejectionReason!,
    );
  },

  async cancelBankTransferRequest(
    paymentId: string,
    userId: string,
  ) {
    const profile = await paymentRepository.findProfileByUserId(
      parseId(userId),
    );

    if (!profile) {
      throw new Error("Không tìm thấy hồ sơ người thuê.");
    }

    return paymentRepository.cancelBankTransferRequest(
      parseId(paymentId),
      profile.id,
    );
  },

  async getPaymentHistory(invoiceId: string) {
    return paymentRepository.findPaymentsByInvoiceId(
      parseId(invoiceId),
    );
  },
};