
"use client";

import { signOut } from "next-auth/react";
import {
  Bell,
  LogOut,
  UserRound,
  ChevronDown,
  User,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type HeaderProps = {
  email?: string | null;
};

export default function Header({ email }: HeaderProps) {
  const [openMenu, setOpenMenu] = useState(false);
    const handleLogout = async () => {
    await signOut({
      redirect: false,
    });

    window.location.href = "/public/auth/login";
  };
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-7">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <span className="text-lg font-bold">X</span>
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-800">
            Xóm Cũ
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Hệ thống quản lý phòng trọ
          </p>
        </div>
      </div>

      {/* User actions */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Notification */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
        >
          <Bell size={21} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserRound size={19} />
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[180px] truncate text-sm font-semibold text-slate-700">
                {email || "Tài khoản"}
              </p>
              <p className="text-xs text-slate-400">
                Tài khoản của tôi
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform sm:block ${
                openMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {openMenu && (
            <>
              <button
                type="button"
                aria-label="Đóng menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpenMenu(false)}
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="text-xs text-slate-400">
                    Đang đăng nhập bằng
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {email || "Tài khoản"}
                  </p>
                </div>

                <Link
                    href="/tenant/profiles"
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
