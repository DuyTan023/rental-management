"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

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
import { Textarea } from "@/components/ui/textarea";

import { Plus } from "lucide-react";

type FormCreateRoomProps = {
  trigger: ReactElement;
  onSuccess?: () => void;
};

export function FormCreateRoom({ trigger, onSuccess }: FormCreateRoomProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [roomNumber, setRoomNumber] = useState("");
  const [area, setArea] = useState("");
  const [maxOccupants, setMaxOccupants] = useState("");
  const [listedRent, setListedRent] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setRoomNumber("");
    setArea("");
    setMaxOccupants("");
    setListedRent("");
    setDescription("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const parsedArea = Number(area);
      const parsedMaxOccupants = Number(maxOccupants);
      const parsedListedRent = Number(listedRent);

      if (!roomNumber.trim()) {
        setError("Vui lòng nhập số phòng");
        return;
      }

      if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
        setError("Diện tích phải lớn hơn 0");
        return;
      }

      if (!Number.isInteger(parsedMaxOccupants) || parsedMaxOccupants < 1) {
        setError("Số người tối đa phải là số nguyên lớn hơn 0");
        return;
      }

      if (!Number.isFinite(parsedListedRent) || parsedListedRent < 0) {
        setError("Giá thuê phải là số lớn hơn hoặc bằng 0");
        return;
      }

      const response = await fetch("/api/landlord/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_number: roomNumber.trim(),
          area: parsedArea,
          max_occupants: parsedMaxOccupants,
          listed_rent: parsedListedRent,
          description: description.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Tạo phòng thất bại");
        return;
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi khi tạo phòng");
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
      <DialogTrigger render={trigger} />

      <DialogContent className="overflow-hidden border-0 bg-white p-0 shadow-2xl shadow-slate-950/20 sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 px-6 py-3 text-white">
            <div className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 left-24 size-32 rounded-full bg-indigo-300/20 blur-xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm">
                <Plus className="size-5 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  Thêm phòng mới
                </DialogTitle>

                <DialogDescription className="mt-1.5 text-sm leading-relaxed text-blue-100">
                  Nhập thông tin để tạo phòng trọ mới.
                </DialogDescription>
              </div>
            </div>

            <div className="relative mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-cyan-300 to-white/70" />
          </DialogHeader>

          {/* Form */}
          <FieldGroup className="space-y-1 px-6 py-3">
            {/* Số phòng */}
            <Field className="gap-2">
              <Label
                htmlFor="create-room-number"
                className="text-sm font-semibold text-slate-700"
              >
                Số phòng <span className="text-rose-500">*</span>
              </Label>

              <Input
                id="create-room-number"
                name="room_number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Ví dụ: P101, A202"
                maxLength={20}
                required
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
              />
            </Field>

            {/* Diện tích */}
            <Field className="gap-2">
              <Label
                htmlFor="create-room-area"
                className="text-sm font-semibold text-slate-700"
              >
                Diện tích <span className="text-rose-500">*</span>
              </Label>

              <div className="relative">
                <Input
                  id="create-room-area"
                  name="area"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Nhập diện tích"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pr-14 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  m²
                </span>
              </div>
            </Field>

            {/* Số người tối đa */}
            <Field className="gap-2">
              <Label
                htmlFor="create-room-occupants"
                className="text-sm font-semibold text-slate-700"
              >
                Số người tối đa <span className="text-rose-500">*</span>
              </Label>

              <div className="relative">
                <Input
                  id="create-room-occupants"
                  name="max_occupants"
                  type="number"
                  min="1"
                  step="1"
                  value={maxOccupants}
                  onChange={(e) => setMaxOccupants(e.target.value)}
                  placeholder="Nhập số người tối đa"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pr-20 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">
                  người
                </span>
              </div>
            </Field>

            {/* Giá thuê */}
            <Field className="gap-2">
              <Label
                htmlFor="create-room-rent"
                className="text-sm font-semibold text-slate-700"
              >
                Giá thuê niêm yết <span className="text-rose-500">*</span>
              </Label>

              <div className="relative">
                <Input
                  id="create-room-rent"
                  name="listed_rent"
                  type="number"
                  min="0"
                  step="any"
                  value={listedRent}
                  onChange={(e) => setListedRent(e.target.value)}
                  placeholder="Nhập giá thuê"
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-emerald-200 bg-emerald-50/40 pr-16 text-base font-semibold text-emerald-800 transition-all placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 hover:border-emerald-300 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/10"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                  VNĐ
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Giá thuê niêm yết của phòng. Giá thuê trong hợp đồng được quản
                lý riêng.
              </p>
            </Field>

            {/* Mô tả */}
            <Field className="gap-2">
              <Label
                htmlFor="create-room-description"
                className="text-sm font-semibold text-slate-700"
              >
                Mô tả phòng
              </Label>

              <Textarea
                id="create-room-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả phòng, tiện nghi hoặc thông tin bổ sung..."
                rows={3}
                disabled={loading}
                className="resize-y rounded-xl border-slate-200 bg-slate-50/70 transition-all placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
              />

              <p className="text-xs text-slate-500">
                Có thể để trống nếu không có mô tả.
              </p>
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
          <DialogFooter className="flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex-row sm:justify-end">
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
                  Đang tạo phòng...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Tạo phòng
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
