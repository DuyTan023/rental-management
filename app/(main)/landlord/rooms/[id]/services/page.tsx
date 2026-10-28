"use client";

import {
  ArrowLeft,
  Check,
  Clock,
  History,
  Pencil,
  Plus,
  Power,
  Search,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoomService = {
  id: number;
  serviceId: number;
  name: string;
  unit: string;
  type: "METERED" | "FIXED_PER_MONTH" | "FIXED_PER_HEAD";
  price: number;
  effectiveFrom: string;
};

type PriceHistory = {
  id: number;
  serviceName: string;
  oldPrice: number;
  newPrice: number;
  unit: string;
  effectiveFrom: string;
  changedAt: string;
};

type ServiceOption = {
  id: number;
  name: string;
  unit: string;
  type: RoomService["type"];
  defaultPrice: number;
};

const initialServices: RoomService[] = [
  {
    id: 1,
    serviceId: 1,
    name: "Điện sinh hoạt",
    unit: "kWh",
    type: "METERED",
    price: 4000,
    effectiveFrom: "2026-10-28",
  },
  {
    id: 2,
    serviceId: 2,
    name: "Nước sinh hoạt",
    unit: "m³",
    type: "METERED",
    price: 15000,
    effectiveFrom: "2026-10-28",
  },
  {
    id: 3,
    serviceId: 3,
    name: "Phí vệ sinh, thu gom rác",
    unit: "Phòng/tháng",
    type: "FIXED_PER_MONTH",
    price: 20000,
    effectiveFrom: "2026-10-28",
  },
];

const availableServices: ServiceOption[] = [
  {
    id: 1,
    name: "Điện sinh hoạt",
    unit: "kWh",
    type: "METERED",
    defaultPrice: 4000,
  },
  {
    id: 2,
    name: "Nước sinh hoạt",
    unit: "m³",
    type: "METERED",
    defaultPrice: 15000,
  },
  {
    id: 3,
    name: "Phí vệ sinh, thu gom rác",
    unit: "Phòng/tháng",
    type: "FIXED_PER_MONTH",
    defaultPrice: 20000,
  },
  {
    id: 4,
    name: "Phí gửi xe",
    unit: "Người/tháng",
    type: "FIXED_PER_HEAD",
    defaultPrice: 50000,
  },
  {
    id: 5,
    name: "Internet",
    unit: "Phòng/tháng",
    type: "FIXED_PER_MONTH",
    defaultPrice: 100000,
  },
];

const initialHistory: PriceHistory[] = [
  {
    id: 1,
    serviceName: "Điện sinh hoạt",
    oldPrice: 3500,
    newPrice: 4000,
    unit: "kWh",
    effectiveFrom: "2026-10-28",
    changedAt: "2026-10-28",
  },
  {
    id: 2,
    serviceName: "Nước sinh hoạt",
    oldPrice: 12000,
    newPrice: 15000,
    unit: "m³",
    effectiveFrom: "2026-10-28",
    changedAt: "2026-10-28",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");

const serviceTypeLabel: Record<RoomService["type"], string> = {
  METERED: "Theo chỉ số",
  FIXED_PER_MONTH: "Cố định / tháng",
  FIXED_PER_HEAD: "Theo người / tháng",
};

export default function RoomServicesPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [services, setServices] = useState<RoomService[]>(initialServices);

  const [history, setHistory] = useState<PriceHistory[]>(initialHistory);

  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState<"add" | "edit" | "stop" | null>(null);

  const [selectedService, setSelectedService] = useState<RoomService | null>(
    null,
  );

  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [newPrice, setNewPrice] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("2026-10-28");
  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredHistory = history.filter((item) =>
    item.serviceName.toLowerCase().includes(search.toLowerCase()),
  );

  const unusedServices = availableServices.filter(
    (option) => !services.some((service) => service.serviceId === option.id),
  );

  function openAddDialog() {
    setSelectedService(null);
    setSelectedServiceId(unusedServices[0]?.id.toString() ?? "");
    setNewPrice(unusedServices[0]?.defaultPrice.toString() ?? "");
    setEffectiveDate("2026-10-28");
    setError("");
    setDialog("add");
  }

  function openEditDialog(service: RoomService) {
    setSelectedService(service);
    setNewPrice(service.price.toString());
    setEffectiveDate("2026-10-28");
    setError("");
    setDialog("edit");
  }

  function openStopDialog(service: RoomService) {
    setSelectedService(service);
    setError("");
    setDialog("stop");
  }

  function closeDialog() {
    setDialog(null);
    setSelectedService(null);
    setError("");
  }

  function handleAddService() {
    const option = availableServices.find(
      (item) => item.id === Number(selectedServiceId),
    );

    const price = Number(newPrice);

    if (!option) {
      setError("Vui lòng chọn dịch vụ.");
      return;
    }

    if (services.some((item) => item.serviceId === option.id)) {
      setError("Dịch vụ này đã được áp dụng cho phòng.");
      return;
    }

    if (!Number.isFinite(price) || price < 0 || newPrice.trim() === "") {
      setError("Vui lòng nhập mức giá hợp lệ.");
      return;
    }

    if (!effectiveDate) {
      setError("Vui lòng chọn ngày bắt đầu áp dụng.");
      return;
    }

    setServices((current) => [
      ...current,
      {
        id: Date.now(),
        serviceId: option.id,
        name: option.name,
        unit: option.unit,
        type: option.type,
        price,
        effectiveFrom: effectiveDate,
      },
    ]);

    setNotice(`Đã thêm dịch vụ ${option.name}.`);
    closeDialog();
  }

  function handleUpdatePrice() {
    if (!selectedService) return;

    const price = Number(newPrice);

    if (!Number.isFinite(price) || price < 0 || newPrice.trim() === "") {
      setError("Vui lòng nhập mức giá hợp lệ.");
      return;
    }

    if (!effectiveDate) {
      setError("Vui lòng chọn ngày bắt đầu áp dụng giá mới.");
      return;
    }

    if (effectiveDate < selectedService.effectiveFrom) {
      setError(
        "Ngày áp dụng giá mới không được trước ngày bắt đầu áp dụng giá hiện tại.",
      );
      return;
    }

    if (price === selectedService.price) {
      setError("Giá mới phải khác giá hiện tại.");
      return;
    }

    setHistory((current) => [
      {
        id: Date.now(),
        serviceName: selectedService.name,
        oldPrice: selectedService.price,
        newPrice: price,
        unit: selectedService.unit,
        effectiveFrom: effectiveDate,
        changedAt: "2026-10-28",
      },
      ...current,
    ]);

    setServices((current) =>
      current.map((service) =>
        service.id === selectedService.id
          ? {
              ...service,
              price,
              effectiveFrom: effectiveDate,
            }
          : service,
      ),
    );

    setNotice(`Đã cập nhật giá ${selectedService.name}.`);
    closeDialog();
  }

  function handleStopService() {
    if (!selectedService) return;

    setServices((current) =>
      current.filter((service) => service.id !== selectedService.id),
    );

    setNotice(`Đã ngừng dịch vụ ${selectedService.name}.`);
    closeDialog();
  }

  function handleServiceSelection(value: string) {
    setSelectedServiceId(value);

    const option = availableServices.find((item) => item.id === Number(value));

    if (option) {
      setNewPrice(option.defaultPrice.toString());
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-4 md:p-6 lg:p-8">
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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Quản lý dịch vụ phòng
              </h1>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                P101
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý dịch vụ, giá áp dụng và lịch sử thay đổi của phòng.
            </p>
          </div>
        </div>

        <Button
          onClick={openAddDialog}
          disabled={unusedServices.length === 0}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm dịch vụ
        </Button>
      </div>

      {/* NOTICE */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            {notice}
          </div>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="rounded p-1 hover:bg-green-100"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Settings2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Dịch vụ đang áp dụng</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {services.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Tổng giá dịch vụ cố định</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(
                  services
                    .filter((service) => service.type !== "METERED")
                    .reduce((sum, service) => sum + service.price, 0),
                )}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  /tháng*
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <History className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Lần thay đổi giá</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {history.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SERVICE MANAGEMENT */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-lg">Dịch vụ của phòng P101</CardTitle>
            <CardDescription className="mt-1">
              Theo dõi mức giá đang áp dụng và quản lý từng dịch vụ.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("current")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  activeTab === "current"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đang áp dụng
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {services.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  activeTab === "history"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Lịch sử giá
              </button>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm dịch vụ..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "current" ? (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
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
                    {filteredServices.map((service) => (
                      <tr
                        key={service.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {service.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            ID dịch vụ: {service.serviceId}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {serviceTypeLabel[service.type]}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {service.unit}
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(service.price)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(service.effectiveFrom)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => openEditDialog(service)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Sửa giá
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openStopDialog(service)}
                            >
                              <Power className="h-3.5 w-3.5" />
                              Ngừng
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredServices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <Settings2 className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-3 font-medium text-slate-700">
                            Không tìm thấy dịch vụ
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Thử tìm bằng tên dịch vụ khác.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-3 md:hidden">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {service.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {serviceTypeLabel[service.type]} · {service.unit}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        Đang áp dụng
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Giá hiện tại</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatCurrency(service.price)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Từ {formatDate(service.effectiveFrom)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          Sửa giá
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => openStopDialog(service)}
                        >
                          Ngừng
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Không tìm thấy dịch vụ.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Giá hiển thị là giá áp dụng cho phòng. Tiền dịch vụ thực tế sẽ
                  phụ thuộc vào loại dịch vụ, chỉ số sử dụng và quy tắc tính
                  phí.
                </p>
              </div>
            </>
          ) : (
            /* PRICE HISTORY */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Dịch vụ</th>
                    <th className="px-4 py-3 font-medium">Giá cũ</th>
                    <th className="px-4 py-3 font-medium">Giá mới</th>
                    <th className="px-4 py-3 font-medium">Ngày áp dụng</th>
                    <th className="px-4 py-3 font-medium">Ngày ghi nhận</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.serviceName}
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {formatCurrency(item.oldPrice)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(item.newPrice)}
                        </div>

                        <div
                          className={`mt-1 text-xs ${
                            item.newPrice > item.oldPrice
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.newPrice > item.oldPrice ? "+" : ""}
                          {formatCurrency(item.newPrice - item.oldPrice)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.effectiveFrom)}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.changedAt)}
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Chưa có lịch sử thay đổi giá.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD SERVICE DIALOG */}
      <Dialog
        open={dialog === "add"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm dịch vụ cho phòng</DialogTitle>
            <DialogDescription>
              Chọn dịch vụ và thiết lập giá áp dụng riêng cho P101.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="service-option">Dịch vụ</Label>

              <select
                id="service-option"
                value={selectedServiceId}
                onChange={(event) => handleServiceSelection(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {unusedServices.length === 0 && (
                  <option value="">Không còn dịch vụ để thêm</option>
                )}

                {unusedServices.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-price">Giá áp dụng (VNĐ)</Label>
              <Input
                id="add-price"
                type="number"
                min="0"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                placeholder="Nhập giá dịch vụ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-effective-date">Ngày bắt đầu áp dụng</Label>
              <Input
                id="add-effective-date"
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleAddService}
              disabled={unusedServices.length === 0}
            >
              Thêm dịch vụ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE PRICE DIALOG */}
      <Dialog
        open={dialog === "edit"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi giá dịch vụ</DialogTitle>
            <DialogDescription>
              {selectedService?.name}. Giá mới sẽ được ghi nhận cùng ngày bắt
              đầu áp dụng.
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Giá hiện tại</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatCurrency(selectedService.price)}
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    / {selectedService.unit}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-price">Giá mới (VNĐ)</Label>
                <Input
                  id="update-price"
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(event) => setNewPrice(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-effective-date">
                  Ngày bắt đầu áp dụng giá mới
                </Label>
                <Input
                  id="update-effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                />
              </div>

              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Khi kết nối API, cần lưu lịch sử giá cũ và bảo đảm hóa đơn đã
                  chốt không bị thay đổi.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={handleUpdatePrice}>Lưu giá mới</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STOP SERVICE DIALOG */}
      <Dialog
        open={dialog === "stop"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ngừng dịch vụ khỏi phòng?</DialogTitle>
            <DialogDescription>
              Bạn đang ngừng áp dụng dịch vụ này cho phòng P101.
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600">
                  <Power className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedService.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Giá hiện tại: {formatCurrency(selectedService.price)}/{" "}
                    {selectedService.unit}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-red-700">
                Dịch vụ sẽ không còn xuất hiện trong danh sách đang áp dụng. Khi
                kết nối API, lịch sử dịch vụ cần được giữ lại thay vì xóa bản
                ghi trong cơ sở dữ liệu.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleStopService}>
              <Power className="mr-2 h-4 w-4" />
              Xác nhận ngừng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
