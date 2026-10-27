"use client";

import type { services } from "@/generated/prisma/client";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ServiceProps = {
  service: services;
};

export function FormUpdateService({ service }: ServiceProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(service.name);
  const [unit, setUnit] = useState(service.unit);
  const [type, setType] = useState(service.type);
  const [price, setPrice] = useState(String(service.default_unit_price));
  const [isActive, setIsActive] = useState(service.is_active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Cập nhật thông tin dịch vụ
      const response = await fetch(`/api/landlord/services/${service.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim(),
          type,
          default_unit_price: Number(price),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Cập nhật dịch vụ thất bại");
        return;
      }

      // Cập nhật trạng thái nếu có thay đổi
      if (isActive !== service.is_active) {
        const statusResponse = await fetch(
          `/api/landlord/services/${service.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(isActive),
          },
        );

        const statusResult = await statusResponse.json();

        if (!statusResponse.ok || !statusResult.success) {
          setError(
            statusResult.message || "Cập nhật trạng thái dịch vụ thất bại",
          );
          return;
        }
      }

      // Cập nhật thành công
      setOpen(false);
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi khi cập nhật dịch vụ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (value) {
          setError("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="h-8 w-full border border-blue-500/20 bg-gradient-to-r from-blue-700 to-indigo-700 text-xs font-semibold text-white shadow-md shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-indigo-800 hover:shadow-lg hover:shadow-blue-900/30"
          >
            <Pencil className="mr-1.5 size-3.5" />
            Cập nhật
          </Button>
        }
      />

      <DialogContent className="overflow-hidden border-0 bg-white p-0 shadow-2xl shadow-slate-950/20 sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 px-6 py-3 text-white">
            <div className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 left-24 size-32 rounded-full bg-indigo-300/20 blur-xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm">
                <Pencil className="size-5 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  Cập nhật dịch vụ
                </DialogTitle>

                <DialogDescription className="mt-1.5 text-sm leading-relaxed text-blue-100">
                  Chỉnh sửa thông tin và đơn giá cho dịch vụ{" "}
                  <span className="font-semibold text-white">
                    {service.name}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>

            <div className="relative mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-cyan-300 to-white/70" />
          </DialogHeader>

          {/* Form */}
          <FieldGroup className="space-y-1 px-6 py-3">
            {/* Tên dịch vụ */}
            <Field className="gap-2">
              <Label
                htmlFor="service-name"
                className="text-sm font-semibold text-slate-700"
              >
                Tên dịch vụ <span className="text-rose-500">*</span>
              </Label>

              <Input
                id="service-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Điện, Nước, Internet"
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
              />
            </Field>

            {/* Đơn vị tính */}
            <Field className="gap-2">
              <Label
                htmlFor="service-unit"
                className="text-sm font-semibold text-slate-700"
              >
                Đơn vị tính <span className="text-rose-500">*</span>
              </Label>

              <Input
                id="service-unit"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ví dụ: kWh, m³, người, tháng"
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
              />
            </Field>

            {/* Loại dịch vụ */}
            <Field className="gap-2">
              <Label
                htmlFor="service-type"
                className="text-sm font-semibold text-slate-700"
              >
                Loại dịch vụ <span className="text-rose-500">*</span>
              </Label>

              <Select
                value={type}
                onValueChange={(value) => {
                  if (value) {
                    setType(value as services["type"]);
                  }
                }}
              >
                <SelectTrigger
                  id="service-type"
                  className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/70 transition-all hover:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                >
                  <SelectValue placeholder="Chọn loại dịch vụ" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="METERED">Theo chỉ số sử dụng</SelectItem>

                  <SelectItem value="FIXED_PER_MONTH">
                    Cố định theo tháng
                  </SelectItem>

                  <SelectItem value="FIXED_PER_HEAD">
                    Tính theo đầu người
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Đơn giá */}
            <Field className="gap-2">
              <Label
                htmlFor="service-price"
                className="text-sm font-semibold text-slate-700"
              >
                Đơn giá mặc định <span className="text-rose-500">*</span>
              </Label>

              <div className="relative">
                <Input
                  id="service-price"
                  name="default_unit_price"
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Nhập đơn giá"
                  required
                  className="h-12 rounded-xl border-emerald-200 bg-emerald-50/40 pr-16 text-base font-semibold text-emerald-800 transition-all placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/10"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                  VNĐ
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Đơn giá mặc định áp dụng khi tính phí dịch vụ.
              </p>
            </Field>

            {/* Trạng thái */}
            <Field className="gap-2">
              <div
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-amber-200 bg-amber-50/80"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        isActive
                          ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                          : "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <Label
                      htmlFor="service-status"
                      className="cursor-pointer text-sm font-bold text-slate-800"
                    >
                      Trạng thái dịch vụ
                    </Label>

                    <p
                      className={`text-xs font-semibold ${
                        isActive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {isActive
                        ? "Đang hoạt động · Có thể sử dụng"
                        : "Đang tạm dừng · Không hoạt động"}
                    </p>
                  </div>
                </div>

                <Switch
                  id="service-status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={loading}
                  className="shrink-0"
                />
              </div>
            </Field>

            {/* Thông báo lỗi */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
                role="alert"
              >
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold">
                  !
                </div>

                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}
          </FieldGroup>

          {/* Footer */}
          <DialogFooter className="flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 pt-5 pb-7 sm:flex-row sm:justify-end">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="h-10 rounded-xl border-slate-300 bg-white px-5 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  Hủy
                </Button>
              }
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-10 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 font-semibold text-white shadow-md shadow-blue-900/20 transition-all hover:from-blue-800 hover:to-indigo-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 size-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
