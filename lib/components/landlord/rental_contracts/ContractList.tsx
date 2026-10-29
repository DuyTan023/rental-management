"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { useState } from "react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type Contract = {
  id: string;
  contract_number: string;
  room_number: string;
  tenant_name: string;
  start_date: string;
  end_date: string | null;
  status: ContractStatus;
};

const MOCK_CONTRACTS: Contract[] = [
  {
    id: "1",
    contract_number: "HD1510262028",
    room_number: "P101",
    tenant_name: "Nguyễn Văn An",
    start_date: "2026-10-15",
    end_date: "2027-10-14",
    status: "ACTIVE",
  },
  {
    id: "2",
    contract_number: "HD2010262029",
    room_number: "P102",
    tenant_name: "Trần Thị Bình",
    start_date: "2026-10-20",
    end_date: "2027-04-19",
    status: "ACTIVE",
  },
  {
    id: "3",
    contract_number: "HD0510262030",
    room_number: "P103",
    tenant_name: "Lê Văn Cường",
    start_date: "2026-10-05",
    end_date: "2026-12-31",
    status: "DRAFT",
  },
  {
    id: "4",
    contract_number: "HD0101262031",
    room_number: "P201",
    tenant_name: "Phạm Thị Dung",
    start_date: "2026-01-01",
    end_date: "2026-10-01",
    status: "EXPIRED",
  },
  {
    id: "5",
    contract_number: "HD0109252032",
    room_number: "P202",
    tenant_name: "Hoàng Văn Đức",
    start_date: "2025-09-01",
    end_date: "2026-08-31",
    status: "COMPLETED",
  },
  {
    id: "6",
    contract_number: "HD1508262033",
    room_number: "P203",
    tenant_name: "Đỗ Thị Hà",
    start_date: "2026-08-15",
    end_date: "2027-08-14",
    status: "TERMINATED",
  },
  {
    id: "7",
    contract_number: "HD0111262034",
    room_number: "P301",
    tenant_name: "Nguyễn Minh Khang",
    start_date: "2026-11-01",
    end_date: "2027-10-31",
    status: "DRAFT",
  },
  {
    id: "8",
    contract_number: "HD1511262035",
    room_number: "P302",
    tenant_name: "Vũ Thị Lan",
    start_date: "2026-11-15",
    end_date: "2027-11-14",
    status: "ACTIVE",
  },
  {
    id: "9",
    contract_number: "HD0107262036",
    room_number: "P303",
    tenant_name: "Bùi Văn Nam",
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    status: "ACTIVE",
  },
  {
    id: "10",
    contract_number: "HD0105262037",
    room_number: "P401",
    tenant_name: "Đặng Thị Oanh",
    start_date: "2026-05-01",
    end_date: "2026-10-31",
    status: "EXPIRED",
  },
];

const STATUS_CONFIG: Record<
  ContractStatus,
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

const PAGE_SIZE = 5;

function formatDate(date: string | null) {
  if (!date) return "Không xác định";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function ContractList() {
  const [contracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = contracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentContracts = contracts.slice(startIndex, startIndex + PAGE_SIZE);

  const handleView = (contract: Contract) => {
    console.log("Xem hợp đồng:", contract.id);
  };

  const handleEdit = (contract: Contract) => {
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

        <Badge variant="secondary">{totalItems} hợp đồng</Badge>
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
              {currentContracts.length > 0 ? (
                currentContracts.map((contract) => {
                  const status = STATUS_CONFIG[contract.status];

                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="pl-4 font-medium sm:pl-6">
                        {contract.contract_number}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{contract.room_number}</Badge>
                      </TableCell>

                      <TableCell>{contract.tenant_name}</TableCell>

                      <TableCell>{formatDate(contract.start_date)}</TableCell>

                      <TableCell>{formatDate(contract.end_date)}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-4 text-center sm:pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Mở menu thao tác"
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleView(contract)}
                            >
                              <Eye className="mr-2 size-4" />
                              Xem chi tiết
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleEdit(contract)}
                            >
                              <Pencil className="mr-2 size-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            {totalItems === 0
              ? "Chưa có dữ liệu"
              : `Hiển thị ${startIndex + 1}–${Math.min(
                  startIndex + PAGE_SIZE,
                  totalItems,
                )} trong tổng số ${totalItems} hợp đồng`}
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang trước"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Trang ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label="Trang sau"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
