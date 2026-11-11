
"use client";

import { useCallback, useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import {
  Check,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PaymentAccount = {
  id: string;
  provider: string;
  account_number: string;
  account_name: string;
  branch: string | null;
  qr_image_url: string | null;
  note: string | null;
  is_active: boolean;
  is_default: boolean;
};

type AccountForm = {
  provider: string;
  account_number: string;
  account_name: string;
  branch: string;
  qr_image_url: string;
  note: string;
  is_active: boolean;
  is_default: boolean;
};

const EMPTY_FORM: AccountForm = {
  provider: "",
  account_number: "",
  account_name: "",
  branch: "",
  qr_image_url: "",
  note: "",
  is_active: true,
  is_default: false,
};

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/landlord/payment-accounts", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải tài khoản.");
      }

      setAccounts(result.data ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const updateForm = <K extends keyof AccountForm>(
    key: K,
    value: AccountForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (account: PaymentAccount) => {
    setEditingId(account.id);

    setForm({
      provider: account.provider,
      account_number: account.account_number,
      account_name: account.account_name,
      branch: account.branch ?? "",
      qr_image_url: account.qr_image_url ?? "",
      note: account.note ?? "",
      is_active: account.is_active,
      is_default: account.is_default,
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.provider.trim() ||
      !form.account_number.trim() ||
      !form.account_name.trim()
    ) {
      setError("Vui lòng nhập đầy đủ ngân hàng/ví, số tài khoản và tên chủ tài khoản.");
      return;
    }

    if (form.is_default && !form.is_active) {
      setError("Tài khoản mặc định phải đang hoạt động.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        editingId
          ? `/api/landlord/payment-accounts/${editingId}`
          : "/api/landlord/payment-accounts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            branch: form.branch || null,
            qr_image_url: form.qr_image_url || null,
            note: form.note || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lưu tài khoản.");
      }

      setSuccess(result.message);
      resetForm();
      await fetchAccounts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi lưu tài khoản."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (account: PaymentAccount) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ngừng sử dụng tài khoản ${account.provider} - ${account.account_number}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/landlord/payment-accounts/${account.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể ngừng sử dụng.");
      }

      setSuccess(result.message);
      await fetchAccounts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi."
      );
    }
  };

  const handleToggleActive = async (account: PaymentAccount) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/landlord/payment-accounts/${account.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_active: !account.is_active,
            // Tài khoản mặc định không thể bị tắt bằng thao tác này.
            ...(account.is_default && !account.is_active
              ? { is_default: false }
              : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể cập nhật trạng thái.");
      }

      setSuccess("Cập nhật trạng thái thành công.");
      await fetchAccounts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi."
      );
    }
  };

  const handleSetDefault = async (account: PaymentAccount) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/landlord/payment-accounts/${account.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_default: true }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể đặt mặc định.");
      }

      setSuccess("Đã đặt tài khoản mặc định.");
      await fetchAccounts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-10">
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">
            Quản lý tài khoản thanh toán
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin ngân hàng, ví điện tử và mã QR
          để người thuê sử dụng khi thanh toán.
        </p>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            {editingId ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </h2>

          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              <X className="mr-1 h-4 w-4" />
              Hủy chỉnh sửa
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ngân hàng / Ví điện tử *</Label>
            <Input
              value={form.provider}
              onChange={(e) => updateForm("provider", e.target.value)}
              placeholder="Ví dụ: MoMo, Vietcombank..."
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Số tài khoản / Số điện thoại *</Label>
            <Input
              value={form.account_number}
              onChange={(e) =>
                updateForm("account_number", e.target.value)
              }
              placeholder="Nhập số tài khoản"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tên chủ tài khoản *</Label>
            <Input
              value={form.account_name}
              onChange={(e) =>
                updateForm("account_name", e.target.value)
              }
              placeholder="NGUYEN VAN A"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Chi nhánh</Label>
            <Input
              value={form.branch}
              onChange={(e) => updateForm("branch", e.target.value)}
              placeholder="Không bắt buộc"
              maxLength={255}
            />
          </div>
        </div>

        {/* QR UPLOAD */}

        <div className="space-y-2">
          <Label>Mã QR thanh toán</Label>

          <CldUploadWidget
            config={{
              cloud: { cloudName: "tpreemmc" },
            }}
            uploadPreset={
              process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
            }
            options={{
              sources: ["local"],
              multiple: false,
              maxFiles: 1,
              resourceType: "image",
              clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
              maxFileSize: 5_000_000,
            }}
            onSuccess={(result) => {
              if (
                typeof result.info !== "string" &&
                result.info?.secure_url
              ) {
                updateForm("qr_image_url", result.info.secure_url);
              }
            }}
          >
            {({ open }) => (
              <Button
                type="button"
                variant="outline"
                onClick={() => open()}
              >
                <QrCode className="mr-2 h-4 w-4" />
                {form.qr_image_url ? "Thay ảnh QR" : "Tải ảnh QR lên"}
              </Button>
            )}
          </CldUploadWidget>

          {form.qr_image_url && (
            <div className="flex flex-col items-start gap-2 rounded-lg border p-3">
              <img
                src={form.qr_image_url}
                alt="Mã QR thanh toán"
                className="h-48 w-48 rounded-lg border object-contain"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateForm("qr_image_url", "")}
              >
                <X className="mr-1 h-4 w-4" />
                Xóa ảnh QR
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Ghi chú</Label>
          <Textarea
            value={form.note}
            onChange={(e) => updateForm("note", e.target.value)}
            placeholder="Thông tin bổ sung..."
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => {
                updateForm("is_active", e.target.checked);

                if (!e.target.checked) {
                  updateForm("is_default", false);
                }
              }}
            />
            Đang hoạt động
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_default}
              disabled={!form.is_active}
              onChange={(e) =>
                updateForm("is_default", e.target.checked)
              }
            />
            Đặt làm tài khoản mặc định
          </label>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              {editingId ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Cập nhật tài khoản" : "Thêm tài khoản"}
            </>
          )}
        </Button>
      </form>

      {/* ACCOUNT LIST */}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Danh sách tài khoản</h2>
          <span className="text-sm text-muted-foreground">
            {accounts.length} tài khoản
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản thanh toán nào.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`space-y-3 rounded-xl border bg-white p-4 ${
                  !account.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {account.provider}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {account.account_number}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1">
                    {account.is_default && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        Mặc định
                      </span>
                    )}

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        account.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {account.is_active ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Chủ tài khoản</p>
                  <p className="font-medium">{account.account_name}</p>
                </div>

                {account.branch && (
                  <p className="text-xs text-muted-foreground">
                    Chi nhánh: {account.branch}
                  </p>
                )}

                {account.qr_image_url && (
                  <img
                    src={account.qr_image_url}
                    alt={`QR ${account.provider}`}
                    className="h-36 w-36 rounded-lg border object-contain p-1"
                  />
                )}

                {account.note && (
                  <p className="text-xs text-muted-foreground">
                    {account.note}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(account)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Sửa
                  </Button>

                  {account.is_active && !account.is_default && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(account)}
                    >
                      <Star className="mr-1 h-4 w-4" />
                      Đặt mặc định
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(account)}
                  >
                    {account.is_active ? "Tắt" : "Bật"}
                  </Button>

                  {account.is_active && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeactivate(account)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Ngừng sử dụng
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
