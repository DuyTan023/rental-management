"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react"; // Import icon con mắt
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Login() {
  // Kiểm tra lỗi khong nhập email hoặc password
  const [errors, setError] = useState({
    email: "",
    password: "",
  });

  // Bắt lỗi đăng nhập
  const [loginError, setLoginError] = useState<boolean>(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Tràn thí hiện / ẩn password
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  // Hàm xử lý đăng nhập
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newInfor = {
      email: "",
      password: "",
    };

    // Inout email và password rỗng
    if (!email) newInfor.email = "Vui lòng nhập email!";
    if (!password) newInfor.password = "Vui lòng nhập password!";

    setError(newInfor);

    // Nếu 1 trong 2 rỗng hoăc cả 2 rỗng thì return về dừng hàm
    if (newInfor.email || newInfor.password) {
      return;
    }

    try {
      setLoading(true);

      // gọi hàm đăng nhập với phương thức email - password
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Nếu có lỗi đăng nhập gán lỗi  = true trả về dừng hàm
      if (result?.error) {
        setLoginError(true);
        return;
      }

      setLoginError(false);

      window.location.href = "/public/auth/redirect";
    } catch (error) {
      console.log("Login error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Hình tròn background */}
      <div className="absolute -left-[180px] -top-[220px] h-[650px] w-[650px] rounded-full bg-blue-500" />
      <div className="absolute -bottom-[180px] -left-[150px] h-[410px] w-[410px] rounded-full bg-blue-500" />
      <div className="absolute -bottom-[300px] -right-[180px] h-[710px] w-[710px] rounded-full bg-blue-500" />

      {/* Form đăng nhập */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl border- border-blue-300">
          {/* Phần 1: tiều đề */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-500">ĐĂNG NHẬP</h1>
            <p className="mt-2 text-sm text-gray-400">
              Xóm cũ - Đăng nhập để trở về
            </p>
          </div>

          {/* Phần 2: From login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input email */}
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

            {/* Input password */}
            <div className="space-y-2">
              <Label className="font-bold text-gray-500">Mật khẩu</Label>
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

            {/* Quên mật khẩu */}
            <div className="text-right">
              <Link
                href={`/public/auth/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-sm font-medium text-blue-500 hover:text-blue-600"
              >
                {" "}
                Quên mật khẩu?
              </Link>
            </div>

            {/* Button đăng nhập */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-lg hover:bg-blue-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          {/* Kết quả đăng nhập sai */}
          {loginError && (
            <p className="mt-8 text-sm text-red-500 text-center">
              Mật khẩu hoặc tài khoản không đúng!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
