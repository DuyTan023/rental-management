
import {
  paymentAccountRepository,
  type PaymentAccountInput,
} from "@/lib/api/repositories/payment-accounts/payment-account.repository";

class PaymentAccountError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "PaymentAccountError";
  }
}

function parseId(id: string): bigint {
  if (!/^[1-9]\d*$/.test(id)) {
    throw new PaymentAccountError("ID tài khoản không hợp lệ.");
  }

  return BigInt(id);
}

function validateInput(input: Partial<PaymentAccountInput>) {
  if (
    input.provider !== undefined &&
    !input.provider.trim()
  ) {
    throw new PaymentAccountError("Vui lòng nhập ngân hàng hoặc ví điện tử.");
  }

  if (
    input.account_number !== undefined &&
    !input.account_number.trim()
  ) {
    throw new PaymentAccountError("Vui lòng nhập số tài khoản.");
  }

  if (
    input.account_name !== undefined &&
    !input.account_name.trim()
  ) {
    throw new PaymentAccountError("Vui lòng nhập tên chủ tài khoản.");
  }

  if (
    input.qr_image_url &&
    !/^https?:\/\/.+/i.test(input.qr_image_url)
  ) {
    throw new PaymentAccountError("Đường dẫn ảnh QR không hợp lệ.");
  }
}

function normalizeInput(
  input: Partial<PaymentAccountInput>
): Partial<PaymentAccountInput> {
  return {
    ...input,
    provider: input.provider?.trim(),
    account_number: input.account_number?.trim(),
    account_name: input.account_name?.trim(),
    branch: input.branch?.trim() || null,
    qr_image_url: input.qr_image_url?.trim() || null,
    note: input.note?.trim() || null,
  };
}

export const paymentAccountService = {
  async getAll() {
    const accounts = await paymentAccountRepository.findAll();

    return accounts.map((account) => ({
      ...account,
      id: account.id.toString(),
    }));
  },

  async getActive() {
    const accounts = await paymentAccountRepository.findActive();

    return accounts.map((account) => ({
      ...account,
      id: account.id.toString(),
    }));
  },

  async create(input: PaymentAccountInput) {
    validateInput(input);

    if (!input.provider?.trim()) {
      throw new PaymentAccountError("Vui lòng nhập ngân hàng hoặc ví điện tử.");
    }

    if (!input.account_number?.trim()) {
      throw new PaymentAccountError("Vui lòng nhập số tài khoản.");
    }

    if (!input.account_name?.trim()) {
      throw new PaymentAccountError("Vui lòng nhập tên chủ tài khoản.");
    }

    const account = await paymentAccountRepository.create(
      normalizeInput(input) as PaymentAccountInput
    );

    return {
      ...account,
      id: account.id.toString(),
    };
  },

  async update(id: string, input: Partial<PaymentAccountInput>) {
    validateInput(input);

    const account = await paymentAccountRepository.update(
      parseId(id),
      normalizeInput(input)
    );

    return {
      ...account,
      id: account.id.toString(),
    };
  },

  async deactivate(id: string) {
    const account = await paymentAccountRepository.findById(
      parseId(id)
    );

    if (!account) {
      throw new PaymentAccountError("Không tìm thấy tài khoản.", 404);
    }

    const result = await paymentAccountRepository.deactivate(
      account.id
    );

    return {
      ...result,
      id: result.id.toString(),
    };
  },
};

export { PaymentAccountError };
