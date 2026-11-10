
export interface CreateOvernightStayInput {
  contract_id: string;
  guest_name: string;
  guest_identity_number?: string;
  guest_phone?: string;
  guest_address?: string;
  check_in_at: string;
  check_out_at: string;
  note?: string;
}

export type UpdateOvernightStayInput = Omit<
  CreateOvernightStayInput,
  "contract_id"
>;

export function validateOvernightStayInput(
  input: CreateOvernightStayInput | UpdateOvernightStayInput
) {
  if (!input.guest_name?.trim()) {
    throw new Error("Vui lòng nhập họ tên khách lưu trú");
  }

  if (input.guest_name.trim().length > 255) {
    throw new Error("Họ tên khách không được vượt quá 255 ký tự");
  }

  if (!input.check_in_at || !input.check_out_at) {
    throw new Error("Vui lòng nhập thời gian lưu trú");
  }

  const checkIn = new Date(input.check_in_at);
  const checkOut = new Date(input.check_out_at);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new Error("Thời gian lưu trú không hợp lệ");
  }

  if (checkOut <= checkIn) {
    throw new Error("Thời gian rời đi phải sau thời gian đến");
  }

  if (
    input.guest_identity_number &&
    input.guest_identity_number.length > 50
  ) {
    throw new Error("Số CCCD không hợp lệ");
  }

  if (
    input.guest_phone &&
    input.guest_phone.length > 20
  ) {
    throw new Error("Số điện thoại không hợp lệ");
  }
}
