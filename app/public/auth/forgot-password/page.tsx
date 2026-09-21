"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [errors, setError] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const newInfor = {
    email: "",
    password: "",
    confirmPassword: "",
  };

  const nextStep = () => {
    if (step === 1) {
      if (!email) newInfor.email = "Vui lòng nhập email!";
    }

    setError(newInfor);
    setStep(step + 1);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    // Tự động chuyển sang ô tiếp theo
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 3) {
      if (!password) newInfor.password = "Vui lòng nhập Mật mới";
      if (!confirmPassword)
        newInfor.confirmPassword = "Vui lòng nhập lại Mật khẩu mới";
    }
    setError(newInfor);
  };
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Hình tròn background */}
      <div className="absolute -left-[180px] -top-[220px] h-[650px] w-[650px] rounded-full bg-blue-500" />
      <div className="absolute -bottom-[180px] -left-[150px] h-[410px] w-[410px] rounded-full bg-blue-500" />
      <div className="absolute -bottom-[300px] -right-[180px] h-[710px] w-[710px] rounded-full bg-blue-500" />

      {/* Fomr xử lý */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl border- border-blue-300">
          {/* Phần 1: tiều đề */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-500">
              {step === 1 && "QUÊN MẬT KHẨU"}
              {step === 2 && "XÁC THỰC OTP"}
              {step === 3 && "ĐẶT MẬT KHẨU MỚI"}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {step === 1 && "Nhập email để nhận mã xác thực"}
              {step === 2 && "Nhập mã OTP đã được gửi đến email của bạn"}
              {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
            </p>
          </div>

          {/* Thân form xử lý có 3 step */}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-bold text-gray-500">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={
                    errors.email
                      ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-100"
                      : "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                  }
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <Button
                type="button"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={nextStep}
              >
                Gửi mã OTP
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center text-sm text-gray-500">
                Mã OTP đã được gửi đến
                <p className="mt-1 font-medium text-gray-900">
                  {email || "email của bạn"}
                </p>
              </div>

              {/* OTP */}
              <div className="space-y-2">
                <Label>Mã OTP 6 số</Label>

                <div className="flex justify-between gap-2">
                  {otp.map((value, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      value={value}
                      maxLength={1}
                      inputMode="numeric"
                      className="h-12 w-12 text-center text-lg font-semibold border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => setStep(3)}
              >
                Xác nhận OTP
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-500">Chưa nhận được mã?</span>

                <button
                  type="button"
                  className="ml-1 font-medium text-blue-500 hover:text-blue-600"
                >
                  Gửi lại
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-500">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"} // Đổi type linh hoạt
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pr-10 ${
                      errors.password
                        ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-100"
                        : "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                    }`}
                  />
                  {/* Nút con mắt */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              {/* Nhập lại mật khẩu mới */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-500">
                  Nhập lại mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"} // Đổi type linh hoạt
                    placeholder="Nhập mật khẩu của bạn"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-10 ${
                      errors.confirmPassword
                        ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-100"
                        : "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                    }`}
                  />
                  {/* Nút con mắt */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                <p className="mb-1 font-medium text-gray-700">
                  Mật khẩu nên có:
                </p>

                <p>✓ Ít nhất 8 ký tự</p>
                <p>✓ Có chữ hoa</p>
                <p>✓ Có chữ thường</p>
                <p>✓ Có ít nhất một chữ số</p>
              </div>

              <Button
                type="button"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleChangePassword}
              >
                Đổi mật khẩu
              </Button>
            </div>
          )}

          {/* Back */}
          <div className="mt-6 text-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                ← Quay lại
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                ← Quay lại đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
