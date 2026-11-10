
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  AlertCircle,
  ChevronRight,
  House,
  Loader2,
  Upload,
  X,
  ImagePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  TenantAsset,
  TenantAssetsResponse,
  IncidentPriority,
} from "@/lib/types/tenant-asset-incident.type";

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

const PRIORITIES: {
  value: IncidentPriority;
  label: string;
}[] = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

export default function CreateTenantIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assets, setAssets] = useState<TenantAsset[]>([]);
  const [assetId, setAssetId] = useState(searchParams.get("asset_id") ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IncidentPriority>("MEDIUM");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAssets() {
      try {
        setLoadingAssets(true);

        const response = await fetch("/api/tenant/assets", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không thể tải tài sản.");
        }

        const data = unwrapData<TenantAssetsResponse>(result);
        const activeAssets = (data.assets ?? []).filter(
          (asset) => asset.is_active,
        );

        setAssets(activeAssets);

        const queryAssetId = searchParams.get("asset_id");
        if (
          queryAssetId &&
          activeAssets.some((asset) => asset.id === queryAssetId)
        ) {
          setAssetId(queryAssetId);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Không thể tải danh sách tài sản.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingAssets(false);
      }
    }

    void fetchAssets();
    return () => controller.abort();
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!assetId) {
      setError("Vui lòng chọn tài sản cần báo cáo.");
      return;
    }

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề sự cố.");
      return;
    }

    if (!description.trim()) {
      setError("Vui lòng mô tả tình trạng sự cố.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/tenant/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset_id: assetId,
          title: title.trim(),
          description: description.trim(),
          image_urls: imageUrls,
          priority,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể gửi báo cáo.");
      }

      router.push("/tenant/incidents");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi báo cáo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((item) => item !== url));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/tenant/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <Link href="/tenant/reports/incidents" className="hover:text-blue-600">
            Báo cáo sự cố
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-600">Tạo báo cáo</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Báo cáo sự cố mới
        </h1>
        <p className="text-sm text-muted-foreground">
          Mô tả sự cố bạn gặp phải để chủ trọ có thể kiểm tra và xử lý.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="asset_id">Tài sản gặp sự cố *</Label>

          {loadingAssets ? (
            <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh sách tài sản...
            </div>
          ) : assets.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Phòng hiện chưa có tài sản nào để báo cáo.
            </div>
          ) : (
            <select
              id="asset_id"
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">-- Chọn tài sản --</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} (Số lượng: {asset.quantity})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề sự cố *</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Máy lạnh không hoạt động"
            maxLength={255}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả chi tiết *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Mô tả tình trạng, thời điểm phát hiện và thông tin liên quan..."
            maxLength={5000}
            rows={5}
            required
          />
          <p className="text-right text-xs text-muted-foreground">
            {description.length}/5000 ký tự
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Mức độ ưu tiên *</Label>
          <select
            id="priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IncidentPriority)
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {PRIORITIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <Label>Hình ảnh minh chứng</Label>

          <CldUploadWidget
            config={{
              cloud: {
                cloudName: "tpreemmc",
              },
            }}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
            options={{
              sources: ["local"],
              multiple: true,
              maxFiles: 10 - imageUrls.length,
              resourceType: "image",
              clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
              maxFileSize: 5_000_000,
            }}
            onSuccess={(result) => {
              if (
                typeof result.info !== "string" &&
                result.info?.secure_url
              ) {
                const url = result.info.secure_url;

                setImageUrls((prev) =>
                  prev.includes(url) || prev.length >= 10
                    ? prev
                    : [...prev, url],
                );
              }
            }}
            onError={(uploadError) => {
              console.error("Cloudinary upload error:", uploadError);
              setError("Tải ảnh thất bại. Vui lòng thử lại.");
            }}
          >
            {({ open }) => (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={imageUrls.length >= 10}
                onClick={() => open()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Tải ảnh lên ({imageUrls.length}/10)
              </Button>
            )}
          </CldUploadWidget>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-2"
                >
                  <img
                    src={url}
                    alt="Ảnh minh chứng sự cố"
                    className="max-h-full max-w-full rounded-md object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Hỗ trợ JPG, PNG, WEBP. Tối đa 10 ảnh, mỗi ảnh tối đa 5 MB.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Link href="/tenant/reports/incidents">
            <Button type="button" variant="outline" className="w-full">
              Hủy
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={submitting || loadingAssets || assets.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi báo cáo"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
