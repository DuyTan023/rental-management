
"use client";

import { Eye, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RentalContractWithDetails } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";
import type { rental_contract_status } from "@/generated/prisma/enums";
import Link from "next/link";

type ContractProps = {
  contracts: RentalContractWithDetails[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  totalPage: number;
  onPageChange: (page: number) => void;
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

const STATUS_CONFIG: Record<
  rental_contract_status,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "border-gray-200 bg-gray-100 text-gray-700",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    className: "border-green-200 bg-green-100 text-green-700",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    className: "border-orange-200 bg-orange-100 text-orange-700",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "border-red-200 bg-red-100 text-red-700",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "border-blue-200 bg-blue-100 text-blue-700",
  },
};

export function ContractList({
  contracts,
  loading,
  error,
  page,
  total,
  totalPage,
  onPageChange,
}: ContractProps) {
  const startIndex = total === 0 ? 0 : (page - 1) * 10 + 1;
  const endIndex = Math.min(page * 10, total);

  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPage, page + 2);

    if (page <= 2) end = Math.min(totalPage, 5);
    if (page >= totalPage - 1) start = Math.max(1, totalPage - 4);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="size-5 text-blue-600" />
          </div>

          <div>
            <CardTitle className="text-base font-bold sm:text-lg">
              Danh sách hợp đồng
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý các hợp đồng thuê phòng
            </p>
          </div>
        </div>

        <Badge variant="secondary">{total} hợp đồng</Badge>
      </CardHeader>

      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[155px] pl-4 sm:pl-6">
                  Mã hợp đồng
                </TableHead>
                <TableHead className="min-w-[90px]">Phòng</TableHead>
                <TableHead className="min-w-[170px]">Người đại diện</TableHead>
                <TableHead className="min-w-[120px]">Ngày bắt đầu</TableHead>
                <TableHead className="min-w-[120px]">Ngày kết thúc</TableHead>
                <TableHead className="min-w-[135px]">Trạng thái</TableHead>
                <TableHead className="min-w-[140px] pr-4 text-center sm:pr-6">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Đang tải danh sách hợp đồng...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-red-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không tìm thấy hợp đồng phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => {
                  const status = STATUS_CONFIG[contract.status];

                  return (
                    <TableRow key={String(contract.id)}>
                      <TableCell className="pl-4 font-medium sm:pl-6">
                        {contract.contract_number}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {contract.rooms.room_number}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {contract.contract_tenants.find(
                          (tenant) => tenant.role === "REPRESENTATIVE",
                        )?.profiles?.full_name ?? "Chưa có người đại diện"}
                      </TableCell>

                      <TableCell>{formatDate(contract.start_date)}</TableCell>
                      <TableCell>{formatDate(contract.end_date)}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-4 text-center sm:pr-6">
                        <Link
                          href={`/landlord/rental_contracts/${contract.id}`}
                        >
                          <Button
                            variant="outline"
                            className="border-2 border-black bg-white text-black"
                          >
                            <Eye className="mr-2 size-4" />
                            Xem chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && !error && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-sm text-muted-foreground">
              Hiển thị {startIndex}–{endIndex} trong {total} hợp đồng
            </p>

            {totalPage > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (page > 1) onPageChange(page - 1);
                      }}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === page}
                        onClick={(event) => {
                          event.preventDefault();
                          onPageChange(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (page < totalPage) onPageChange(page + 1);
                      }}
                      className={
                        page === totalPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
