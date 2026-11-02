"use client";

import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountInfo = {
  fullName: string;
  email: string;
};

type PasswordField = "newPassword" | "confirmPassword";

type PasswordErrors = Record<PasswordField, string>;

type InvitationState =
  | { status: "loading" }
  | { status: "valid"; account: AccountInfo }
  | { status: "invalid"; message: string };

const INITIAL_ERRORS: PasswordErrors = {
  newPassword: "",
  confirmPassword: "",
};

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

function ActivePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  // Trạng thái lời mời được quản lý như một giá trị duy nhất.
  const [invitation, setInvitation] = useState<InvitationState>({
    status: "loading",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<PasswordErrors>(INITIAL_ERRORS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Xác minh lời mời khi token thay đổi hoặc người dùng thử lại.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadInvitation() {
      try {
        if (!token) {
          throw new Error(
            "Liên kết kích hoạt không hợp lệ hoặc thiếu mã kích hoạt.",
          );
        }

        const response = await fetch(
          `/api/auth/activate?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "Không thể xác minh lời mời kích hoạt.",
          );
        }

        if (!result?.data?.email) {
          throw new Error("Không lấy được thông tin tài khoản.");
        }

        if (cancelled) return;

        setInvitation({
          status: "valid",
          account: {
            fullName: result.data.fullName || "Người dùng",
            email: result.data.email,
          },
        });
      } catch (error) {
        if (cancelled) return;

        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setInvitation({
          status: "invalid",
          message:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi khi xác minh lời mời.",
        });
      }
    }

    void loadInvitation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, retryKey]);

  const account = invitation.status === "valid" ? invitation.account : null;

  // Điều kiện mật khẩu theo quy tắc của giao diện đổi mật khẩu.
  const requirements = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
  };

  const isPasswordValid = Object.values(requirements).every(Boolean);

  const updatePassword = (field: PasswordField, value: string) => {
    if (field === "newPassword") {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }

    setErrors((previous) => ({
      ...previous,
      [field]: "",
      ...(field === "newPassword" ? { confirmPassword: "" } : {}),
    }));

    setApiError("");
  };

  const validateForm = () => {
    const nextErrors: PasswordErrors = { ...INITIAL_ERRORS };

    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (!isPasswordValid) {
      nextErrors.newPassword = "Mật khẩu chưa đáp ứng đủ các điều kiện.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || success || !account) return;

    setApiError("");

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "Không thể kích hoạt tài khoản. Vui lòng thử lại.",
        );
      }

      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setErrors(INITIAL_ERRORS);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || success;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            {success ? (
              <ShieldCheck className="h-8 w-8" />
            ) : (
              <KeyRound className="h-8 w-8" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {success ? "Kích hoạt thành công" : "Kích hoạt tài khoản"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {success
              ? "Tài khoản của bạn đã sẵn sàng sử dụng."
              : "Xác nhận thông tin và thiết lập mật khẩu để bắt đầu sử dụng hệ thống."}
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {invitation.status === "loading" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <LoaderCircle className="mb-4 h-8 w-8 animate-spin text-blue-600" />
              <p className="font-medium text-slate-700">
                Đang xác minh lời mời...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Vui lòng chờ trong giây lát.
              </p>
            </div>
          ) : invitation.status === "invalid" ? (
            <div className="py-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <X className="h-7 w-7" />
              </div>

              <h2 className="font-semibold text-slate-900">
                Không thể kích hoạt tài khoản
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {invitation.message}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Liên kết có thể đã hết hạn hoặc đã được sử dụng. Vui lòng liên
                hệ người quản lý để được hỗ trợ.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                Thử kiểm tra lại
              </Button>
            </div>
          ) : success ? (
            <div className="py-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-7 w-7" />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Chào mừng bạn!
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tài khoản đã được kích hoạt và mật khẩu đã được thiết lập thành
                công.
              </p>

              <p className="mt-3 break-all font-medium text-blue-700">
                {account?.email}
              </p>

              <Button
                type="button"
                className="mt-6 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                Đến trang đăng nhập
              </Button>
            </div>
          ) : account ? (
            <>
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-800">
                    Thông tin tài khoản
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Họ và tên
                    </p>
                    <p className="break-words font-semibold text-slate-800">
                      {account.fullName}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      Email đăng nhập
                    </p>
                    <p className="break-all font-medium text-blue-700">
                      {account.email}
                    </p>
                  </div>
                </div>

                <p className="mt-3 border-t border-blue-100 pt-3 text-xs leading-5 text-slate-500">
                  Hãy kiểm tra thông tin để chắc chắn đây là tài khoản của bạn.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Tạo mật khẩu mới</Label>

                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      disabled={isDisabled}
                      onChange={(event) =>
                        updatePassword("newPassword", event.target.value)
                      }
                      aria-invalid={!!errors.newPassword}
                      aria-describedby={
                        errors.newPassword ? "newPassword-error" : undefined
                      }
                      className={`rounded-xl pr-11 ${
                        errors.newPassword
                          ? "border-red-400 focus-visible:ring-red-500/30"
                          : "border-blue-200 focus-visible:ring-blue-500/30"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isDisabled}
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.newPassword && (
                    <p id="newPassword-error" className="text-xs text-red-500">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      disabled={isDisabled}
                      onChange={(event) =>
                        updatePassword("confirmPassword", event.target.value)
                      }
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                      className={`rounded-xl pr-11 ${
                        errors.confirmPassword
                          ? "border-red-400 focus-visible:ring-red-500/30"
                          : "border-blue-200 focus-visible:ring-blue-500/30"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      disabled={isDisabled}
                      aria-label={
                        showConfirmPassword
                          ? "Ẩn mật khẩu xác nhận"
                          : "Hiện mật khẩu xác nhận"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="text-xs text-red-500"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="mb-3 font-medium text-slate-700">
                    Mật khẩu cần đáp ứng:
                  </p>

                  <div className="space-y-2">
                    <RequirementItem fulfilled={requirements.minLength}>
                      Ít nhất 8 ký tự
                    </RequirementItem>
                    <RequirementItem fulfilled={requirements.uppercase}>
                      Có ít nhất một chữ hoa (A-Z)
                    </RequirementItem>
                    <RequirementItem fulfilled={requirements.lowercase}>
                      Có ít nhất một chữ thường (a-z)
                    </RequirementItem>
                    <RequirementItem fulfilled={requirements.number}>
                      Có ít nhất một chữ số (0-9)
                    </RequirementItem>
                  </div>
                </div>

                {apiError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{apiError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Đang kích hoạt...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Kích hoạt tài khoản
                    </>
                  )}
                </Button>

                <p className="text-center text-xs leading-5 text-slate-500">
                  Hãy bảo vệ mật khẩu và không chia sẻ mật khẩu với bất kỳ ai.
                </p>
              </form>
            </>
          ) : null}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Hệ thống quản lý phòng trọ
        </p>
      </div>
    </main>
  );
}

export default function ActivePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </main>
      }
    >
      <ActivePageContent />
    </Suspense>
  );
}
