
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  History,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PriceAdjustment = {
  id: string;
  effective_date: string;
  new_rent_price: string | number;
  reason: string | null;
  created_at: string;
};

type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type Props = {
  contractId: string;
  roomId: string;
  baseRentPrice: string | number;
  onRoomUpdated: (newListedRent: number) => void;
};

type AdjustmentStatus = "ACTIVE" | "REPLACED" | "FUTURE";

type AdjustmentWithStatus = PriceAdjustment & {
  adjustmentStatus: AdjustmentStatus;
};

const PAGE_SIZE = 10;

function formatCurrency(value: string | number) {
  const amount = Number(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Chuẩn hóa ngày về YYYY-MM-DD.
 * So sánh theo ngày lịch, tránh lệch ngày do múi giờ.
 */
function dateKey(value: string | Date) {
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);

    if (match) return match[0];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function todayString() {
  return dateKey(new Date());
}

function formatDate(value: string) {
  const key = dateKey(value);
  const parts = key.split("-");

  if (parts.length !== 3 || !key) return "Không xác định";

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function compareAdjustments(
  a: PriceAdjustment,
  b: PriceAdjustment,
) {
  const dateDifference =
    dateKey(b.effective_date).localeCompare(dateKey(a.effective_date));

  if (dateDifference !== 0) return dateDifference;

  // Nếu cùng ngày hiệu lực, bản ghi tạo sau được ưu tiên.
  return (
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime()
  );
}

export function ContractRentManager({
  contractId,
  roomId,
  baseRentPrice,
  onRoomUpdated,
}: Props) {
  const baseRent = Number(baseRentPrice);

  const [currentPrice, setCurrentPrice] = useState(baseRent);
  const [history, setHistory] = useState<PriceAdjustment[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const [newPrice, setNewPrice] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayString);
  const [reason, setReason] = useState("");

  const baseUrl =
    `/api/landlord/rental_contracts/${contractId}/price_ajustments`;

  const loadHistory = useCallback(
    async (requestedPage: number, append = false) => {
      setLoadingHistory(true);
      setError("");

      try {
        const response = await fetch(
          `${baseUrl}?page=${requestedPage}&limit=${PAGE_SIZE}`,
          { cache: "no-store" },
        );

        const result: ApiResponse<PaginationResult<PriceAdjustment>> =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể tải lịch sử điều chỉnh giá.",
          );
        }

        setHistory((previous) => {
          if (!append) return result.data.data;

          const existingIds = new Set(previous.map((item) => item.id));
          const newItems = result.data.data.filter(
            (item) => !existingIds.has(item.id),
          );

          return [...previous, ...newItems];
        });

        setTotal(result.data.total);
        setPage(requestedPage);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải lịch sử.",
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [baseUrl],
  );

  // Tải trang đầu khi hợp đồng thay đổi.
  useEffect(() => {
    setHistory([]);
    setPage(0);
    setTotal(0);
    setCurrentPrice(baseRent);
    void loadHistory(1);
  }, [baseRent, loadHistory]);

  const today = todayString();

  /**
   * Phân loại lịch sử:
   * - FUTURE: ngày hiệu lực chưa đến.
   * - ACTIVE: bản ghi có hiệu lực mới nhất tính đến hôm nay.
   * - REPLACED: đã có hiệu lực nhưng bị một bản ghi mới hơn thay thế.
   */
  const historyWithStatus = useMemo<AdjustmentWithStatus[]>(() => {
    const sorted = [...history].sort(compareAdjustments);

    const applicable = sorted
      .filter((item) => dateKey(item.effective_date) <= today)
      .sort(compareAdjustments);

    const activeId = applicable[0]?.id;

    return sorted.map((item) => {
      const key = dateKey(item.effective_date);

      let adjustmentStatus: AdjustmentStatus;

      if (key > today) {
        adjustmentStatus = "FUTURE";
      } else if (item.id === activeId) {
        adjustmentStatus = "ACTIVE";
      } else {
        adjustmentStatus = "REPLACED";
      }

      return { ...item, adjustmentStatus };
    });
  }, [history, today]);

  // Giá hiện hành là lần điều chỉnh gần nhất đã đến ngày hiệu lực.
  useEffect(() => {
    const applicable = [...history]
      .filter((item) => dateKey(item.effective_date) <= today)
      .sort(compareAdjustments);

    setCurrentPrice(
      applicable.length > 0
        ? Number(applicable[0].new_rent_price)
        : baseRent,
    );
  }, [history, baseRent, today]);


const handleCreate = async () => {
  setError("");

  const parsedPrice = Number(newPrice);

  if (
    !newPrice.trim() ||
    !Number.isFinite(parsedPrice) ||
    parsedPrice <= 0
  ) {
    setError("Vui lòng nhập giá thuê lớn hơn 0.");
    return;
  }

  if (!effectiveDate) {
    setError("Vui lòng chọn ngày hiệu lực.");
    return;
  }

  setSaving(true);

  try {
    const adjustmentResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effective_date: `${effectiveDate}T00:00:00.000Z`,
        new_rent_price: parsedPrice,
        reason: reason.trim() || null,
      }),
    });

    const adjustmentResult = await adjustmentResponse.json();

    if (!adjustmentResponse.ok || !adjustmentResult.success) {
      throw new Error(
        adjustmentResult.message ||
          "Không thể tạo lịch sử điều chỉnh giá.",
      );
    }

    // Chỉ cập nhật giá niêm yết nếu ngày hiệu lực đã đến.
    const isEffective = effectiveDate <= todayString();

    if (isEffective) {
      const roomResponse = await fetch(`/api/landlord/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed_rent: parsedPrice }),
      });

      const roomResult = await roomResponse.json();

      if (!roomResponse.ok || !roomResult.success) {
        throw new Error(
          roomResult.message ||
            "Đã tạo lịch sử điều chỉnh nhưng chưa cập nhật được giá niêm yết phòng.",
        );
      }

      onRoomUpdated(parsedPrice);
    }

    setOpen(false);
    setNewPrice("");
    setReason("");
    setEffectiveDate(todayString());

    await loadHistory(1);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Đã xảy ra lỗi khi điều chỉnh giá thuê.",
    );
  } finally {
    setSaving(false);
  }
};


  const hasMore = history.length < total;

  const statusConfig: Record<
    AdjustmentStatus,
    { label: string; className: string }
  > = {
    ACTIVE: {
      label: "Đang áp dụng",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    REPLACED: {
      label: "Đã thay thế",
      className: "border-red-200 bg-red-100 text-red-600",
    },
    FUTURE: {
      label: "Chưa có hiệu lực",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Trạng thái & điều chỉnh giá phòng
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm text-slate-600">
              Giá thuê hợp đồng hiện tại
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {formatCurrency(currentPrice)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Giá có hiệu lực tính đến hôm nay
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) setError("");
            }}
          >
            <DialogTrigger
              render={
                <Button className="w-full gap-2">
                  <Pencil className="h-4 w-4" />
                  Điều chỉnh giá thuê
                </Button>
              }
            />

            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Điều chỉnh giá thuê hợp đồng</DialogTitle>
                <DialogDescription>
                  Nhập giá mới và ngày bắt đầu áp dụng. Lịch sử điều chỉnh
                  sẽ được lưu lại theo hợp đồng.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Giá thuê hiện tại</Label>
                  <Input
                    value={formatCurrency(currentPrice)}
                    readOnly
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-rent-price">
                    Giá thuê mới (VNĐ/tháng)
                  </Label>
                  <Input
                    id="new-rent-price"
                    type="number"
                    min="1"
                    step="1000"
                    placeholder="Ví dụ: 2500000"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective-date">Ngày hiệu lực</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={effectiveDate}
                    onChange={(event) => setEffectiveDate(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-reason">
                    Lý do điều chỉnh (không bắt buộc)
                  </Label>
                  <Textarea
                    id="price-reason"
                    placeholder="Ví dụ: Điều chỉnh giá thuê hằng năm..."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setOpen(false)}
                >
                  Hủy
                </Button>

                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleCreate}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Lưu điều chỉnh
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              Lịch sử điều chỉnh giá phòng theo hợp đồng
            </CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            Có {total} lần điều chỉnh giá được ghi nhận.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && !open && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {loadingHistory && history.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải lịch sử...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
              <History className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-medium text-slate-700">
                Chưa có lịch sử điều chỉnh giá
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Các lần điều chỉnh sau này sẽ được hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyWithStatus.map((item) => {
                const status = statusConfig[item.adjustmentStatus];

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      item.adjustmentStatus === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {formatCurrency(item.new_rent_price)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Hiệu lực từ {formatDate(item.effective_date)}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`w-fit ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {item.reason && (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                        <span className="font-medium">Lý do: </span>
                        {item.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={loadingHistory}
              onClick={() => void loadHistory(page + 1, true)}
            >
              {loadingHistory ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Xem thêm
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
