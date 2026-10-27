import type { services } from "@/generated/prisma/client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Decimal } from "@prisma/client/runtime/client";
import { CalendarDays, Clock, Ruler, Tag, Toolbox } from "lucide-react";
import { FormCreateService } from "./FormCreateService";
import { FormUpdateService } from "./FormUpdateService";

type CardServiceProps = {
  services: services[];
};

export default function CardService({ services }: CardServiceProps) {
  const formatLoaiDichVu = (type: string) => {
    const types: Record<string, string> = {
      METERED: "Theo chỉ số",
      FIXED_PER_MONTH: "Theo tháng",
      FIXED_PER_HEAD: "Theo đầu người",
    };

    return types[type] ?? type;
  };

  const formatCurrency = (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-3 sm:grid-cols-2 sm:p-4 md:p-5 lg:grid-cols-3">
      {services.map((dichVu) => (
        <Card
          key={dichVu.id}
          className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Header */}
          <CardHeader className="p-2.5 pb-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Toolbox className="size-4" />
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-sm font-bold text-xl">
                    {dichVu.name}
                  </CardTitle>
                </div>
              </div>

              <Badge
                variant="secondary"
                className={`shrink-0 px-1.5 py-0 text-[10px] ${
                  dichVu.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {dichVu.is_active ? "Hoạt động" : "Đã tắt"}
              </Badge>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="space-y-2 p-2.5 pt-1">
            {/* Đơn giá */}
            <div className="rounded-lg border bg-muted/30 p-2">
              <p className="mt-0.5 text-xl font-bold tracking-tight">
                {formatCurrency(dichVu.default_unit_price)}
              </p>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Ruler className="size-3" />
                  <span>Đơn vị tính</span>
                </div>

                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {dichVu.unit}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="size-3" />
                  <span>Loại dịch vụ</span>
                </div>

                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {formatLoaiDichVu(dichVu.type)}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" />
                  <span>Ngày tạo</span>
                </div>

                <span className="text-right text-[10px]">
                  {formatDate(dichVu.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>Cập nhật</span>
                </div>

                <span className="text-right text-[10px]">
                  {formatDate(dichVu.updated_at)}
                </span>
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="w-full border-t bg-muted/20 p-2 pt-1 flex item justify-center">
            <div className="w-full">
              <FormUpdateService service={dichVu} />
            </div>
          </CardFooter>
        </Card>
      ))}
      <FormCreateService />
    </div>
  );
}
