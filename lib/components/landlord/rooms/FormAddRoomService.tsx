
"use client";

import { Plus, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RoomServiceWithService } from "@/lib/api/repositories/services/room_service.repository";

type ServiceOption = {
  id: string;
  name: string;
  type: string;
  unit: string;
  default_unit_price: number | string;
  is_active: boolean;
};

type FormAddRoomServiceProps = {
  roomId: string;
  room_services: RoomServiceWithService[];
  onSuccess?: () => void;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
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

  currency: (price: number | string) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price)),
};

export default function FormAddRoomService({
  roomId,
  room_services,
  onSuccess,
}: FormAddRoomServiceProps) {
  const [open, setOpen] = useState(false);
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Lấy danh sách dịch vụ khi mở Dialog
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    const fetchServices = async () => {
      setLoadingServices(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const response = await fetch("/api/landlord/services", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result: ApiResponse<ServiceOption[]> =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể lấy danh sách dịch vụ",
          );
        }

        setAllServices(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi lấy danh sách dịch vụ",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();

    return () => controller.abort();
  }, [open]);

  // Chỉ lấy dịch vụ đang hoạt động và chưa được áp dụng cho phòng
  const availableServices = useMemo(() => {
    const activeServiceIds = new Set(
      room_services.map((item) => String(item.service_id)),
    );

    return allServices.filter(
      (service) =>
        service.is_active &&
        !activeServiceIds.has(String(service.id)),
    );
  }, [allServices, room_services]);

  const selectedService = availableServices.find(
    (service) => String(service.id) === serviceId,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!serviceId) {
      setErrorMessage("Vui lòng chọn dịch vụ cần thêm");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/landlord/rooms/${roomId}/services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: serviceId,
          }),
        },
      );

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể thêm dịch vụ vào phòng",
        );
      }

      setSuccessMessage("Thêm dịch vụ vào phòng thành công!");
      setServiceId("");

      // Báo component cha tải lại danh sách dịch vụ của phòng
      onSuccess?.();

      setOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi thêm dịch vụ",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          setServiceId("");
          setErrorMessage("");
          setSuccessMessage("");
        }
      }}
    >
      <DialogTrigger
        render={
            <Button type="button" className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm dịch vụ
            </Button>
        }
        />

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Thêm dịch vụ vào phòng</DialogTitle>
          <DialogDescription>
            Chọn dịch vụ chưa được áp dụng cho phòng. Giá hiển thị là giá
            mặc định được thiết lập trong danh mục dịch vụ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="service_id">Dịch vụ</Label>

            <select
              id="service_id"
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value);
                setErrorMessage("");
              }}
              disabled={loadingServices || submitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loadingServices
                  ? "Đang tải danh sách dịch vụ..."
                  : "-- Chọn dịch vụ --"}
              </option>

              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedService.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {format.serviceType(selectedService.type)}
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {selectedService.unit}
                </span>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-slate-500">Giá mặc định</p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {format.currency(selectedService.default_unit_price)}
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    / {selectedService.unit}
                  </span>
                </p>
              </div>
            </div>
          )}

          {!loadingServices &&
            !errorMessage &&
            availableServices.length === 0 && (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                Không có dịch vụ nào để thêm. Các dịch vụ hiện có có thể
                đã được áp dụng cho phòng hoặc đang bị vô hiệu hóa.
              </p>
            )}

          {errorMessage && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
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

            <Button
              type="submit"
              disabled={
                loadingServices ||
                submitting ||
                !serviceId ||
                availableServices.length === 0
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm dịch vụ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
