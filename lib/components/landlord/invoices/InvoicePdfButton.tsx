"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

type Props = {
  invoiceId: string;
};

export default function InvoicePdfButton({ invoiceId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExportPdf = async () => {
    // Mở tab ngay trong thao tác click để tránh popup blocker.
    const newTab = window.open("", "_blank");

    if (!newTab) {
      alert("Trình duyệt đang chặn cửa sổ mới. Hãy cho phép popup.");
      return;
    }

    try {
      setLoading(true);

      newTab.document.title = "Đang tạo hóa đơn PDF...";
      newTab.document.body.innerHTML =
        "<p style='font-family:sans-serif;padding:24px'>Đang tải hóa đơn PDF...</p>";

      const response = await fetch(
        `/api/landlord/invoices/${invoiceId}/pdf`
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let message = "Không thể xuất hóa đơn PDF.";

        if (contentType?.includes("application/json")) {
          const result = await response.json();
          message = result.message || message;
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      newTab.location.href = url;

      // Giữ URL đủ lâu để trình duyệt tải và hiển thị PDF.
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (error) {
      newTab.close();

      alert(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi xuất PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}

      {loading ? "Đang xuất..." : "Xem hóa đơn PDF"}
    </button>
  );
}