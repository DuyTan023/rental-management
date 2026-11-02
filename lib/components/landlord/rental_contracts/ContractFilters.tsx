
"use client";

import { useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { rental_contract_status } from "@/generated/prisma/enums";
import type { ExpirationFilter } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

export type ContractFilterValues = {
  status?: rental_contract_status;
  startDateFrom?: string;
  startDateTo?: string;
  expirationFilter?: ExpirationFilter;
  expiringInDays?: number;
};

type ContractFiltersProps = {
  onSearch: (keyword: string) => void;
  onApplyFilters: (filters: ContractFilterValues) => void;
  onReset: () => void;
};

const CONTRACT_STATUS = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đang hiệu lực", value: "ACTIVE" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã chấm dứt", value: "TERMINATED" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
];

const DATE_EXPIRED = [
  { label: "Tất cả", value: "all" },
  { label: "Sắp hết hạn", value: "expiring_soon" },
  { label: "Đã hết hạn", value: "expired" },
];

const EXPIRING_DAYS = [
  { label: "7 ngày tới", value: "7" },
  { label: "15 ngày tới", value: "15" },
  { label: "30 ngày tới", value: "30" },
  { label: "60 ngày tới", value: "60" },
];

export function ContractFilters({
  onSearch,
  onApplyFilters,
  onReset,
}: ContractFiltersProps) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [expirationFilter, setExpirationFilter] = useState("all");
  const [expiringInDays, setExpiringInDays] = useState("30");
  const [open, setOpen] = useState(false);

  const handleApplyFilters = () => {
    if (
      startDateFrom &&
      startDateTo &&
      startDateFrom > startDateTo
    ) {
      return;
    }

    onApplyFilters({
      status:
        status === "all"
          ? undefined
          : (status as rental_contract_status),
      startDateFrom: startDateFrom || undefined,
      startDateTo: startDateTo || undefined,
      expirationFilter:
        expirationFilter === "all"
          ? undefined
          : (expirationFilter as ExpirationFilter),
      expiringInDays:
        expirationFilter === "expiring_soon"
          ? Number(expiringInDays)
          : undefined,
    });

    setOpen(false);
  };

  const handleReset = () => {
    setKeyword("");
    setStatus("all");
    setStartDateFrom("");
    setStartDateTo("");
    setExpirationFilter("all");
    setExpiringInDays("30");
    onReset();
    setOpen(false);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(keyword.trim());
              }
            }}
            placeholder="Tìm mã hợp đồng, phòng, tên người thuê..."
            className="h-10 pl-9"
          />
        </div>

        <Button
          type="button"
          className="h-10"
          onClick={() => onSearch(keyword.trim())}
        >
          <Search className="mr-2 size-4" />
          Tìm kiếm
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button type="button" variant="outline" className="h-10">
                <Filter className="mr-2 size-4" />
                Bộ lọc
              </Button>
            }
          />

          <PopoverContent className="mt-2 w-[calc(100vw-2rem)] max-w-[900px] space-y-5 border border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="size-4" />
                Bộ lọc hợp đồng
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Trạng thái hợp đồng
                  </label>
                  <Select
                    items={CONTRACT_STATUS}
                    value={status}
                    onValueChange={(value) => {
                      if (value) setStatus(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>

                    <SelectContent>
                      {CONTRACT_STATUS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày bắt đầu từ
                  </label>
                  <Input
                    type="date"
                    value={startDateFrom}
                    max={startDateTo || undefined}
                    onChange={(event) => setStartDateFrom(event.target.value)}
                    className="h-10 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày bắt đầu đến
                  </label>
                  <Input
                    type="date"
                    value={startDateTo}
                    min={startDateFrom || undefined}
                    onChange={(event) => setStartDateTo(event.target.value)}
                    className="h-10 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tình trạng hết hạn
                  </label>
                  <Select
                    value={expirationFilter}
                    onValueChange={(value) => {
                      if (value) setExpirationFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_EXPIRED.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {expirationFilter === "expiring_soon" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sắp hết hạn trong
                    </label>
                    <Select
                      items={DATE_EXPIRED}
                      value={expirationFilter}
                      onValueChange={(value) => {
                        if (value) setExpirationFilter(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn tình trạng" />
                      </SelectTrigger>

                      <SelectContent>
                        {DATE_EXPIRED.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {startDateFrom &&
                startDateTo &&
                startDateFrom > startDateTo && (
                  <p className="text-sm text-red-600">
                    Ngày bắt đầu từ không được lớn hơn ngày bắt đầu đến.
                  </p>
                )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                Đặt lại
              </Button>
              <Button type="button" onClick={handleApplyFilters}>
                Áp dụng bộ lọc
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
