"use client";

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTRACT_STATUS = [
  { label: "Tất cả trạng thái", value: null },
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đang hiệu lực", value: "ACTIVE" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã chấm dứt", value: "TERMINATED" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
];

const DATE_EXPIRED = [
  { label: "Tất cả", value: null },
  { label: "Sắp hết hạn", value: "EXPIRING_SOON" },
  { label: "Đã Hết hạn", value: "EXPIRED" },
];

export function ContractFilters() {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      {/* Thanh tìm kiếm */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Tìm mã hợp đồng, phòng, tên người thuê..."
            className="h-10 pl-9"
          />
        </div>

        <Button className="h-10">
          <Search className="mr-2 size-4" />
          Tìm kiếm
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <PopoverTrigger
                render={
                  <Button variant="outline" className="h-10">
                    <Filter className="mr-2 size-4" />
                    Bộ lọc
                  </Button>
                }
              />
            }
          />
          <PopoverContent className="w-[calc(100vw-2rem)] max-w-[900px] bg-gray-50 border-1 border-gray-200 -translate-x-0.5 lg:-translate-x-4 space-y-5 mt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="size-4" />
                Bộ lọc hợp đồng
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Trạng thái hợp đồng */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Trạng thái hợp đồng
                  </label>

                  <Select items={CONTRACT_STATUS}>
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        {CONTRACT_STATUS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ngày bắt đầu từ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày bắt đầu từ</label>

                  <Input type="date" className="h-10" />
                </div>

                {/* Ngày bắt đầu đến */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày bắt đầu đến
                  </label>

                  <Input type="date" className="h-10" />
                </div>

                {/* Tình trạng hết hạn */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tình trạng hết hạn
                  </label>

                  <Select items={DATE_EXPIRED}>
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        {DATE_EXPIRED.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Nút thao tác */}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" type="button">
                Đặt lại
              </Button>

              <Button type="button">Áp dụng bộ lọc</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
