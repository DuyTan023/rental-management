"use client";

import { Check, Eye, EyeOff, KeyRound, LoaderCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ========================================
// 1. KIỂU DỮ LIỆU
// ========================================

type PasswordField = "oldPassword" | "newPassword" | "confirmPassword";

type PasswordErrors = Record<PasswordField, string>;

type PasswordVisibility = Record<PasswordField, boolean>;

const INITIAL_ERRORS: PasswordErrors = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const INITIAL_VISIBILITY: PasswordVisibility = {
  oldPassword: false,
  newPassword: false,
  confirmPassword: false,
};

// ========================================
// 2. COMPONENT HIỂN THỊ ĐIỀU KIỆN
// ========================================

function RequirementItem({
  fulfilled,
  children,
}: {
  fulfilled: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={`flex items-center gap-2 ${
        fulfilled ? "text-green-600" : "text-gray-500"
      }`}
    >
      {fulfilled ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : (
        <X className="h-4 w-4 shrink-0 text-gray-400" />
      )}

      <span>{children}</span>
    </p>
  );
}

// ========================================
// 3. COMPONENT Ô NHẬP MẬT KHẨU
// ========================================

type PasswordInputProps = {
  id: PasswordField;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  error: string;
  disabled: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordInput({
  id,
  label,
  placeholder,
  value,
  visible,
  error,
  disabled,
  autoComplete,
  onChange,
  onToggleVisibility,
}: PasswordInputProps) {
  const inputClassName = [
    "pr-10",
    error
      ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50"
      : "border-blue-200 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/50",
  ].join(" ");

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClassName}
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </Field>
  );
}

// ========================================
// 4. COMPONENT ĐỔI MẬT KHẨU
// ========================================

export function UpdatePasswordDialog() {
  const { data: session } = useSession();

  // Dữ liệu các ô mật khẩu.
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Trạng thái hiện hoặc ẩn mật khẩu.
  const [visibility, setVisibility] =
    useState<PasswordVisibility>(INITIAL_VISIBILITY);

  // Lỗi của từng ô nhập.
  const [errors, setErrors] = useState<PasswordErrors>(INITIAL_ERRORS);

  // Trạng thái của Dialog và API.
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thông báo từ API.
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Điều kiện của mật khẩu mới.
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  // ========================================
  // 5. HÀM HỖ TRỢ
  // ========================================

  // Hiện hoặc ẩn mật khẩu của một ô.
  const toggleVisibility = (field: PasswordField) => {
    setVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Cập nhật mật khẩu và xóa thông báo cũ.
  const updatePasswordField = (field: PasswordField, value: string) => {
    if (field === "oldPassword") {
      setOldPassword(value);
    }

    if (field === "newPassword") {
      setNewPassword(value);
    }

    if (field === "confirmPassword") {
      setConfirmPassword(value);
    }

    setErrors((prev) => ({
      ...prev,
      [field]: "",
      ...(field === "newPassword" ? { confirmPassword: "" } : {}),
    }));

    setApiError("");
    setSuccessMessage("");
  };

  // Kiểm tra dữ liệu trước khi gọi API.
  const validateForm = () => {
    const newErrors: PasswordErrors = { ...INITIAL_ERRORS };

    if (!oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại!";
    }

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới!";
    } else if (!isPasswordValid) {
      newErrors.newPassword = "Mật khẩu mới chưa đáp ứng đủ các điều kiện!";
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại!";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu mới!";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  // Xóa dữ liệu và đưa form về trạng thái ban đầu.
  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setErrors(INITIAL_ERRORS);
    setVisibility(INITIAL_VISIBILITY);

    setApiError("");
    setSuccessMessage("");
  };

  // Đóng Dialog và đặt lại form.
  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  // ========================================
  // 6. XỬ LÝ ĐỔI MẬT KHẨU
  // ========================================

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setApiError("");
    setSuccessMessage("");

    // Bước 1: Kiểm tra dữ liệu.
    if (!validateForm()) return;

    // Bước 2: Kiểm tra tài khoản đăng nhập.
    const email = session?.user?.email;

    if (!email) {
      setApiError(
        "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Bước 3: Gửi yêu cầu đến API.
      const response = await fetch("/api/auth/update-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      // Bước 4: Đọc kết quả từ API.
      const result = await response.json().catch(() => null);

      // Nếu API trả về lỗi, hiển thị thông báo.
      if (!response.ok) {
        throw new Error(
          result?.message || "Không thể đổi mật khẩu. Vui lòng thử lại!",
        );
      }

      // Bước 5: Đổi mật khẩu thành công.
      setSuccessMessage(result?.message || "Đổi mật khẩu thành công!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setErrors(INITIAL_ERRORS);
      setVisibility(INITIAL_VISIBILITY);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi. Vui lòng thử lại!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khóa các ô nhập khi đang gửi yêu cầu hoặc đã thành công.
  const isDisabled = isSubmitting || !!successMessage;

  // ========================================
  // 7. GIAO DIỆN
  // ========================================

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Nút mở Dialog */}
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:self-center"
          >
            <KeyRound className="h-4 w-4" />
            Thay đổi mật khẩu
          </button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <KeyRound className="h-5 w-5" />
            Đổi mật khẩu đăng nhập
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleChangePassword}>
          <FieldGroup>
            {/* Mật khẩu hiện tại */}
            <PasswordInput
              id="oldPassword"
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
              value={oldPassword}
              visible={visibility.oldPassword}
              error={errors.oldPassword}
              disabled={isDisabled}
              onChange={(value) => updatePasswordField("oldPassword", value)}
              onToggleVisibility={() => toggleVisibility("oldPassword")}
            />

            {/* Mật khẩu mới */}
            <PasswordInput
              id="newPassword"
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              value={newPassword}
              visible={visibility.newPassword}
              error={errors.newPassword}
              disabled={isDisabled}
              onChange={(value) => updatePasswordField("newPassword", value)}
              onToggleVisibility={() => toggleVisibility("newPassword")}
            />

            {/* Xác nhận mật khẩu mới */}
            <PasswordInput
              id="confirmPassword"
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              value={confirmPassword}
              visible={visibility.confirmPassword}
              error={errors.confirmPassword}
              disabled={isDisabled}
              onChange={(value) =>
                updatePasswordField("confirmPassword", value)
              }
              onToggleVisibility={() => toggleVisibility("confirmPassword")}
            />
          </FieldGroup>

          {/* Các điều kiện của mật khẩu mới */}
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            <p className="mb-2 font-medium text-gray-700">
              Mật khẩu mới cần đáp ứng:
            </p>

            <div className="space-y-1.5">
              <RequirementItem fulfilled={passwordRequirements.minLength}>
                Ít nhất 8 ký tự
              </RequirementItem>

              <RequirementItem fulfilled={passwordRequirements.uppercase}>
                Có ít nhất một chữ hoa (A-Z)
              </RequirementItem>

              <RequirementItem fulfilled={passwordRequirements.lowercase}>
                Có ít nhất một chữ thường (a-z)
              </RequirementItem>

              <RequirementItem fulfilled={passwordRequirements.number}>
                Có ít nhất một chữ số (0-9)
              </RequirementItem>
            </div>
          </div>

          {/* Thông báo thành công */}
          {successMessage && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {/* Thông báo lỗi */}
          {apiError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{apiError}</p>
            </div>
          )}

          {/* Các nút thao tác */}
          <DialogFooter className="mt-5 gap-2">
            {successMessage ? (
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Hoàn tất
              </Button>
            ) : (
              <>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    >
                      Hủy
                    </Button>
                  }
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
