
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  House,
  Loader2,
  Package,
  Pencil,
  Plus,
  Upload,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AssetCondition =
  | "GOOD"
  | "DAMAGED"
  | "UNDER_REPAIR"
  | "BROKEN";

type RoomAsset = {
  id: string;
  room_id: string;
  name: string;
  description: string | null;
  quantity: number;
  condition: AssetCondition;
  purchase_date: string | null;
  unit_price: string | number | null;
  image_url: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AssetForm = {
  name: string;
  description: string;
  quantity: string;
  condition: AssetCondition;
  purchase_date: string;
  unit_price: string;
  image_url: string;
  note: string;
};

const EMPTY_FORM: AssetForm = {
  name: "",
  description: "",
  quantity: "1",
  condition: "GOOD",
  purchase_date: "",
  unit_price: "",
  image_url: "",
  note: "",
};

const CONDITION_CONFIG: Record<
  AssetCondition,
  { label: string; className: string }
> = {
  GOOD: {
    label: "Tốt",
    className: "bg-green-100 text-green-700",
  },
  DAMAGED: {
    label: "Bị hư hỏng",
    className: "bg-amber-100 text-amber-700",
  },
  UNDER_REPAIR: {
    label: "Đang sửa chữa",
    className: "bg-blue-100 text-blue-700",
  },
  BROKEN: {
    label: "Đã hỏng",
    className: "bg-red-100 text-red-700",
  },
};

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

function formatMoney(value: string | number | null) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function getDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function LandlordRoomAssetsPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [assets, setAssets] = useState<RoomAsset[]>([]);
  const [room, setRoom] = useState<{ room_number: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [open, setOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RoomAsset | null>(null);
  const [form, setForm] = useState<AssetForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAssets = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/landlord/rooms/${roomId}/assets`,
        {
          method: "GET",
          cache: "no-store",
          signal,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải tài sản phòng.");
      }

      const data = unwrapData<any>(result);

      setAssets(data.assets ?? []);
      setRoom(data.room ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải tài sản.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAssets(controller.signal);
    return () => controller.abort();
  }, [fetchAssets]);

  const openCreate = () => {
    setEditingAsset(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const openEdit = (asset: RoomAsset) => {
    setEditingAsset(asset);

    setForm({
      name: asset.name,
      description: asset.description ?? "",
      quantity: String(asset.quantity),
      condition: asset.condition,
      purchase_date: getDateInput(asset.purchase_date),
      unit_price:
        asset.unit_price !== null ? String(asset.unit_price) : "",
      image_url: asset.image_url ?? "",
      note: asset.note ?? "",
    });

    setFormError("");
    setOpen(true);
  };

  const handleChange = (field: keyof AssetForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên tài sản.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError("Số lượng phải là số nguyên lớn hơn 0.");
      return;
    }

    if (
      form.unit_price &&
      (!Number.isFinite(Number(form.unit_price)) ||
        Number(form.unit_price) < 0)
    ) {
      setFormError("Đơn giá không hợp lệ.");
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = Boolean(editingAsset);

      const url = isEditing
        ? `/api/landlord/assets/${editingAsset!.id}`
        : `/api/landlord/rooms/${roomId}/assets`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          quantity,
          condition: form.condition,
          purchase_date: form.purchase_date || null,
          unit_price: form.unit_price || null,
          image_url: form.image_url || null,
          note: form.note.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lưu tài sản.");
      }

      setOpen(false);
      setSuccess(
        result.message ||
          (isEditing
            ? "Cập nhật tài sản thành công."
            : "Thêm tài sản thành công."),
      );

      const controller = new AbortController();
      await fetchAssets(controller.signal);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu tài sản.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (asset: RoomAsset) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn ngừng sử dụng tài sản "${asset.name}" không?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`/api/landlord/assets/${asset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: false }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể ngừng sử dụng tài sản.");
      }

      setSuccess(result.message || "Đã ngừng sử dụng tài sản.");

      const controller = new AbortController();
      await fetchAssets(controller.signal);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi.",
      );
    }
  };

  const updateImage = (url: string) => {
    handleChange("image_url", url);
    setFormError("");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/landlord/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <span>Phòng thuê</span>
          <ChevronRight size={14} />
          <span className="text-blue-600">Tài sản phòng</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý tài sản phòng
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {room ? `Phòng ${room.room_number}` : "Quản lý tài sản được bàn giao cho người thuê."}
            </p>
          </div>

          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tài sản
          </Button>
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{success}</div>
          <button onClick={() => setSuccess("")}>Đóng</button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError("")}>Đóng</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Tổng loại tài sản</p>
          <p className="mt-2 text-2xl font-bold">
            {loading ? "—" : assets.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Đang sử dụng</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {loading ? "—" : assets.filter((item) => item.is_active).length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Tổng số lượng</p>
          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "—"
              : assets
                  .filter((item) => item.is_active)
                  .reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Danh sách tài sản</h2>
        <span className="text-sm text-muted-foreground">
          {assets.length} tài sản
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải tài sản...
          </p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold">Chưa có tài sản</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm tài sản để ghi nhận các thiết bị được bàn giao cho người thuê.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tài sản
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const config = CONDITION_CONFIG[asset.condition];

            return (
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex h-48 items-center justify-center bg-muted/30 p-3">
                  {asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="h-full w-full rounded-lg object-contain"
                    />
                  ) : (
                    <Package className="h-14 w-14 text-muted-foreground/40" />
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{asset.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
                      {config.label}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Số lượng:{" "}
                    <span className="font-medium text-foreground">
                      {asset.quantity}
                    </span>
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Đơn giá:{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(asset.unit_price)}
                    </span>
                  </p>

                  {asset.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {asset.description}
                    </p>
                  )}

                  <div className="flex gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(asset)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Button>

                    {asset.is_active && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Ngừng sử dụng"
                        onClick={() => void handleDeactivate(asset)}
                      >
                        <Wrench className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  {!asset.is_active && (
                    <p className="rounded-md bg-gray-100 p-2 text-center text-xs text-gray-600">
                      Đã ngừng sử dụng
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (submitting) return;
          setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Cập nhật tài sản" : "Thêm tài sản mới"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin tài sản được trang bị trong phòng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Tên tài sản *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                maxLength={255}
                placeholder="Ví dụ: Máy lạnh, tủ lạnh..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                placeholder="Mô tả thông tin tài sản..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Tình trạng *</Label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={(e) => handleChange("condition", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="GOOD">Tốt</option>
                  <option value="DAMAGED">Bị hư hỏng</option>
                  <option value="UNDER_REPAIR">Đang sửa chữa</option>
                  <option value="BROKEN">Đã hỏng</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Ngày mua</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => handleChange("purchase_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Đơn giá (VNĐ)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) => handleChange("unit_price", e.target.value)}
                  placeholder="Nhập đơn giá"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh tài sản</Label>

              <CldUploadWidget
                config={{ cloud: { cloudName: "tpreemmc" } }}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
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
                    updateImage(result.info.secure_url);
                  }
                }}
                onError={() => setFormError("Tải ảnh thất bại. Vui lòng thử lại.")}
              >
                {({ open }) => (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => open()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {form.image_url ? "Chọn ảnh khác" : "Tải ảnh lên"}
                  </Button>
                )}
              </CldUploadWidget>

              {form.image_url && (
                <div className="rounded-lg border p-2">
                  <div className="flex h-48 items-center justify-center bg-muted/20">
                    <img
                      src={form.image_url}
                      alt="Ảnh tài sản"
                      className="max-h-full max-w-full rounded-md object-contain"
                    />
                  </div>

                  <div className="mt-2 flex justify-between">
                    <p className="text-xs text-green-600">
                      Đã tải ảnh lên Cloudinary
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateImage("")}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Xóa ảnh
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm..."
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingAsset ? (
                  "Lưu thay đổi"
                ) : (
                  "Thêm tài sản"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
