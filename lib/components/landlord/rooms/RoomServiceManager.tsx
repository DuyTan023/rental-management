
"use client";

import {
  ArrowLeft,
  Clock,
  History,
  Power,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";

import { RoomServiceWithService } from "@/lib/api/repositories/services/room_service.repository";
import { Decimal } from "@prisma/client/runtime/client";
import FormAddRoomService from "./FormAddRoomService";

type RoomServiceProps = {
  room_services: RoomServiceWithService[];
};

const format = {
  serviceType: (type: string) => {
    const types: Record<string, string> = {
      METERED: "Theo chỉ số",
      FIXED_PER_MONTH: "Theo tháng",
      FIXED_PER_HEAD: "Theo đầu người",
    };

    return types[type] ?? type;
  },

  currency: (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  },

  date: (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  },
};

export default function RoomServiceManager({
  room_services,
}: RoomServiceProps) {
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [activeTab, setActiveTab] = useState<"current" | "history">(
    "current",
  );

  // Toàn bộ bản ghi dịch vụ của phòng, bao gồm đang áp dụng và đã ngừng.
  const [services, setServices] =
    useState<RoomServiceWithService[]>(room_services);

  const [selectedService, setSelectedService] =
    useState<RoomServiceWithService | null>(null);

  const [stopping, setStopping] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Chỉ lọc dữ liệu từ state, không cần gọi API riêng cho lịch sử.
  const activeServices = services.filter(
    (item) => item.effective_to === null,
  );

  const historyServices = services.filter(
    (item) => item.effective_to !== null,
  );

  // Tải lại toàn bộ lịch sử dịch vụ của phòng.
  const fetchRoomServices = useCallback(async () => {
    setLoadingServices(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/landlord/rooms/${roomId}/services/history`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ?? "Không thể tải danh sách dịch vụ phòng",
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Dữ liệu dịch vụ trả về không hợp lệ");
      }

      setServices(result.data);
    } catch (error) {
      console.error("Lỗi tải danh sách dịch vụ phòng:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách dịch vụ phòng",
      );
    } finally {
      setLoadingServices(false);
    }
  }, [roomId]);

  // Ngừng dịch vụ: cập nhật effective_to ở backend, sau đó tải lại dữ liệu.
  const handleStopService = async () => {
    if (!selectedService || stopping) return;

    setStopping(true);
    setErrorMessage("");

    try {
      const serviceId = selectedService.services.id;

      const response = await fetch(
        `/api/landlord/rooms/${roomId}/services/${serviceId}`,
        {
          method: "PATCH",
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ?? "Không thể ngừng sử dụng dịch vụ",
        );
      }

      // Đóng dialog sau khi API ngừng dịch vụ thành công.
      setSelectedService(null);

      // Tải lại toàn bộ danh sách.
      await fetchRoomServices();

      // Chuyển sang tab lịch sử để người dùng thấy bản ghi vừa ngừng.
      setActiveTab("history");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi ngừng sử dụng dịch vụ",
      );
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href={`/landlord/rooms/${roomId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại chi tiết phòng
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý dịch vụ phòng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý dịch vụ, giá áp dụng và lịch sử thay đổi của phòng.
            </p>
          </div>
        </div>

        <FormAddRoomService
          roomId={roomId}
          room_services={activeServices}
          onSuccess={fetchRoomServices}
        />
      </div>

      {/* SERVICE MANAGEMENT */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-lg">
              Dịch vụ phòng
            </CardTitle>

            <CardDescription className="mt-1">
              Theo dõi các dịch vụ đang áp dụng và lịch sử dịch vụ của phòng.
            </CardDescription>
          </div>

          {/* TABS */}
          <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("current");
                setErrorMessage("");
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "current"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đang áp dụng
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                {activeServices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("history");
                setErrorMessage("");
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lịch sử áp dụng
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                {historyServices.length}
              </span>
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {errorMessage && !selectedService && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {loadingServices ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Đang tải danh sách dịch vụ...
            </div>
          ) : activeTab === "current" ? (
            <>
              {activeServices.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                  <p className="font-medium text-slate-700">
                    Phòng chưa áp dụng dịch vụ nào
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Bạn có thể thêm dịch vụ mới bằng nút phía trên.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">Dịch vụ</th>
                        <th className="px-4 py-3 font-medium">Loại</th>
                        <th className="px-4 py-3 font-medium">Đơn vị</th>
                        <th className="px-4 py-3 font-medium">Giá áp dụng</th>
                        <th className="px-4 py-3 font-medium">Ngày bắt đầu</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {activeServices.map((item) => {
                        const price =
                          item.unit_price ??
                          item.services.default_unit_price;

                        return (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-4">
                              <span className="font-medium text-slate-900">
                                {item.services.name}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {format.serviceType(item.services.type)}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {item.services.unit}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-900">
                                {format.currency(price)}
                              </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                              {format.date(item.effective_from)}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    setErrorMessage("");
                                    setSelectedService(item);
                                  }}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  Ngừng
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />

                <p>
                  Giá hiển thị là giá áp dụng cho phòng. Tiền dịch vụ thực tế
                  phụ thuộc vào loại dịch vụ, chỉ số sử dụng và quy tắc tính phí.
                </p>
              </div>
            </>
          ) : historyServices.length === 0 ? (
            <div className="py-10 text-center">
              <History className="mx-auto mb-3 h-8 w-8 text-slate-300" />

              <p className="font-medium text-slate-700">
                Chưa có lịch sử dịch vụ
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Lịch sử sẽ xuất hiện sau khi dịch vụ được ngừng áp dụng.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Dịch vụ</th>
                    <th className="px-4 py-3 font-medium">Loại</th>
                    <th className="px-4 py-3 font-medium">Đơn giá</th>
                    <th className="px-4 py-3 font-medium">Ngày bắt đầu</th>
                    <th className="px-4 py-3 font-medium">Ngày kết thúc</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {historyServices.map((item) => {
                    const price =
                      item.unit_price ??
                      item.services.default_unit_price;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-900">
                            {item.services.name}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {format.serviceType(item.services.type)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-900">
                          {format.currency(price)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {format.date(item.effective_from)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {item.effective_to
                            ? format.date(item.effective_to)
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.effective_to === null
                                ? "bg-green-50 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.effective_to === null
                              ? "Đang áp dụng"
                              : "Đã ngừng"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CONFIRM STOP SERVICE */}
      <Dialog
        open={selectedService !== null}
        onOpenChange={(open) => {
          if (!open && !stopping) {
            setSelectedService(null);
            setErrorMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ngừng sử dụng dịch vụ?</DialogTitle>

            <DialogDescription>
              Bạn có chắc chắn muốn ngừng dịch vụ{" "}
              <span className="font-semibold text-slate-900">
                {selectedService?.services.name}
              </span>{" "}
              của phòng này không? Ngày kết thúc sẽ được hệ thống xác định
              tự động.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={stopping}
              onClick={() => {
                setSelectedService(null);
                setErrorMessage("");
              }}
            >
              Hủy
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={stopping}
              onClick={handleStopService}
            >
              <Power className="mr-2 h-4 w-4" />

              {stopping ? "Đang xử lý..." : "Xác nhận ngừng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
