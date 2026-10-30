"use client";

import {
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { RentalContractWithDetails } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";
import { Decimal } from "@prisma/client/runtime/client";
import { rental_contract_status } from "@/generated/prisma/enums";
import Link from "next/link";

type ContractProps = {
  contracts:RentalContractWithDetails[],
  loading: boolean;
  error: string | null;
};

const format = {
  // Format trạng hợp đồng
  roomStatus: (status: string) => {
    const statuses: Record<string, string> = {
      DRAFT: "Bản nháp",
      ACTIVE: "Đang hoạt động",
      EXPIRED: "Đã hết hạn",
      TERMINATED: "Đã chấm dứt",
      COMPLETED: "Đã hoàn thành",
    };

    return statuses[status] ?? status;
  },

  // Format giá tiền
  currency: (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  },

  // Format thời gian

  // Format thời gian
  date: (date: Date | string | null) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsedDate);
  },

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

const PAGE_SIZE = 10;

export function ContractList({contracts, loading, error}: ContractProps) {
    const [page, setPage] = useState(1);

    // Tổng số trang
    const total = contracts.length;
    const totalPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  
    // Nếu danh sách thay đổi và số trang giảm,
    // tự động đưa trang hiện tại về trang hợp lệ.
    const currentPage = Math.min(page, totalPage);
  
    // Chỉ lấy các phòng thuộc trang hiện tại
    // Chỉ lấy các phòng thuộc trang hiện tại
      const currentContracts = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
    
        return contracts.slice(startIndex, startIndex + PAGE_SIZE);
      }, [contracts]);

  // Khoảng dữ liệu đang hiển thị
  const startIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, total);

  // Danh sách số trang
  const getPageNumbers = () => {
    const pages: number[] = [];

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPage, currentPage + 2);

    if (currentPage <= 2) {
      end = Math.min(totalPage, 5);
    }

    if (currentPage >= totalPage - 1) {
      start = Math.max(1, totalPage - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };


  const handleView = (contract: RentalContractWithDetails) => {
    console.log("Xem hợp đồng:", contract.id);
  };

  const handleEdit = (contract: RentalContractWithDetails) => {
    console.log("Chỉnh sửa hợp đồng:", contract.id);
  };

  return (
    <Card className="gap-0 py-0">
      {/* Tiêu đề */}
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

        <Badge variant="secondary">{contracts.length} hợp đồng</Badge>
      </CardHeader>

      {/* Bảng hợp đồng */}
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

                <TableHead className="w-[80px] pr-4 text-center sm:pr-6">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentContracts.length ? (
                currentContracts.map((contract, i) => {
                  const status = STATUS_CONFIG[contract.status];

                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="pl-4 font-medium sm:pl-6">
                        {contract.contract_number}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{contract.rooms.room_number}</Badge>
                      </TableCell>

                      <TableCell>
                          {contract.contract_tenants.find(
                            (tenant) => tenant.role === "REPRESENTATIVE"
                          )?.profiles?.full_name ?? "Chưa có người đại diện"}
                        </TableCell>

                      <TableCell>{format.date(contract.start_date)}</TableCell>

                      <TableCell>{format.date(contract.end_date)}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-4 text-center sm:pr-6">
                        <Link href={`/landlord/rental_contracts/${contract.id}`}>
                            <Button className="bg-white text-black border-2 border-black">
                            <Eye className="mr-2 size-4" />
                            Xem chi tiết
                            </Button>
                        </Link>            
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chưa có hợp đồng nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
              {/* Phân trang */}
              {totalPage > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị {startIndex}–{endIndex} trong {total} phòng
                  </p>

                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();

                            if (currentPage > 1) {
                              setPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers().map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              setPage(pageNumber);
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

                            if (currentPage < totalPage) {
                              setPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage === totalPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
      </CardContent>
    </Card>
  );
}
