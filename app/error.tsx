"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={40} className="text-red-500" />
        </div>

        {/* Error code */}
        <h1 className="text-7xl font-extrabold text-red-500">500</h1>

        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          Đã xảy ra lỗi!
        </h2>

        <p className="mt-3 text-slate-500">
          Xin lỗi, hệ thống đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc
          quay về trang chủ.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-600"
          >
            <RefreshCw size={18} />
            Thử lại
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Home size={18} />
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
