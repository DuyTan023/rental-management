
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type {
  RentalContractWithDetails,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

type ContractDetailProps = {
  contractId: string;
};

type ContractStatus = string;

const formatCurrency = (value: number | string) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (
  value: Date | string | null | undefined
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const STATUS_CONFIG: Record<
  string,
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

const contractStatusItems = [
  { label: "Trạng thái hợp đồng", value: null },
  { label: "Đang hiệu lực", value: "ACTIVE" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã chấm dứt", value: "TERMINATED" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
]

const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Phòng trống",
    className: "border-gray-200 bg-gray-100 text-gray-700",
  },
  OCCUPIED: {
    label: "Đang cho thuê",
    className: "border-green-200 bg-green-100 text-green-700",
  },
  MAINTENANCE: {
    label: "Đang sửa chữa",
    className: "border-orange-200 bg-orange-100 text-orange-700",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    className: "border-red-200 bg-red-100 text-red-700",
  },
};

const getStatusConfig = (status: string | null | undefined) => {
  if (!status) {
    return {
      label: "Chưa cập nhật",
      className: "border-gray-200 bg-gray-100 text-gray-700",
    };
  }

  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      className: "border-gray-200 bg-gray-100 text-gray-700",
    }
  );
};

const getRoomStatusConfig = (
  status: string | null | undefined
) => {
  if (!status) {
    return {
      label: "Chưa cập nhật",
      className: "border-gray-200 bg-gray-100 text-gray-700",
    };
  }

  return (
    ROOM_STATUS_CONFIG[status] ?? {
      label: status,
      className: "border-gray-200 bg-gray-100 text-gray-700",
    }
  );
};

export function ContractDetail({
  contractId,
}: ContractDetailProps) {
  const [contract, setContract] =
    useState<RentalContractWithDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContractStatus>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] =
    useState<string | null>(null);
  const [statusError, setStatusError] =
    useState<string | null>(null);

  // Lấy thông tin hợp đồng
  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể lấy thông tin hợp đồng."
        );
      }

      const contractData = result.data?.data ?? result.data;

      if (
        !contractData ||
        typeof contractData !== "object" ||
        Array.isArray(contractData)
      ) {
        throw new Error("Dữ liệu hợp đồng không hợp lệ.");
      }

      setContract(contractData as RentalContractWithDetails);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy thông tin hợp đồng."
      );
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
  }, [fetchContract]);

  // Mở phần chỉnh sửa trạng thái
  const handleOpenStatusEditor = () => {
    if (!contract) return;

    setSelectedStatus(contract.status ?? "");
    setStatusError(null);
    setStatusMessage(null);
    setShowStatusEditor((prev) => !prev);
  };


  // Gửi yêu cầu cập nhật trạng thái hợp đồng và đồng bộ trạng thái phòng
  const handleUpdateStatus = async () => {
    if (!contract) {
      setStatusError("Không tìm thấy thông tin hợp đồng.");
      return;
    }

    if (!selectedStatus) {
      setStatusError("Vui lòng chọn trạng thái hợp đồng.");
      return;
    }

    if (selectedStatus === contract.status) {
      setStatusError("Trạng thái mới phải khác trạng thái hiện tại.");
      return;
    }

    // Lưu trạng thái cũ trước khi cập nhật
    const previousStatus = contract.status;

    // Xác định trạng thái phòng cần cập nhật
    let roomStatus: "AVAILABLE" | "OCCUPIED" | null = null;

    if (previousStatus === "ACTIVE" && selectedStatus !== "ACTIVE") {
      // Hợp đồng từ ACTIVE chuyển sang trạng thái khác
      roomStatus = "AVAILABLE";
    } else if (
      previousStatus !== "ACTIVE" &&
      selectedStatus === "ACTIVE"
    ) {
      // Hợp đồng từ trạng thái khác chuyển sang ACTIVE
      roomStatus = "OCCUPIED";
    }

    try {
      setUpdatingStatus(true);
      setStatusError(null);
      setStatusMessage(null);

      // BƯỚC 1: Cập nhật trạng thái hợp đồng
      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể cập nhật trạng thái hợp đồng."
        );
      }

      // Lấy dữ liệu hợp đồng sau khi cập nhật
      const updatedContract = result.data?.data ?? result.data;

      // Cập nhật giao diện hợp đồng ngay sau khi API thành công
      if (
        updatedContract &&
        typeof updatedContract === "object" &&
        !Array.isArray(updatedContract) &&
        "contract_number" in updatedContract
      ) {
        setContract(updatedContract as RentalContractWithDetails);
      } else {
        setContract((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            status: selectedStatus as RentalContractWithDetails["status"],
          };
        });
      }

      // BƯỚC 2: Nếu cần, cập nhật trạng thái phòng
      if (roomStatus !== null) {
        const roomResponse = await fetch(
          `/api/landlord/rooms/${contract.room_id.toString()}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: roomStatus,
            }),
          }
        );

        const roomResult = await roomResponse.json();

        if (!roomResponse.ok || !roomResult.success) {
          throw new Error(
            roomResult.message ||
              "Hợp đồng đã cập nhật nhưng không thể cập nhật trạng thái phòng. Vui lòng kiểm tra lại phòng."
          );
        }
      }

      // BƯỚC 3: Thông báo thành công
      setStatusMessage(
        roomStatus !== null
          ? "Cập nhật trạng thái hợp đồng và phòng thành công!"
          : "Cập nhật trạng thái hợp đồng thành công!"
      );

      setShowStatusEditor(false);
      setConfirmOpen(false);
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };


  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Đang tải thông tin hợp đồng...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error ?? "Không tìm thấy hợp đồng."}
      </div>
    );
  }

  const status = getStatusConfig(contract.status);
  const roomStatus = getRoomStatusConfig(
    contract.rooms?.status
  );

  const tenants = contract.contract_tenants ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Tiêu đề trang */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/landlord/rental_contracts" >
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0 bg-white"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Hợp đồng {contract.contract_number}
              </h1>

              <Badge
                variant="outline"
                className={status.className}
              >
                {status.label}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Chi tiết và thông tin quản lý hợp đồng
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="shrink-0"
          onClick={handleOpenStatusEditor}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            Cập nhật trạng thái
          </span>
          <span className="sm:hidden">Cập nhật</span>
        </Button>
      </div>

      {/* Thông báo cập nhật */}
      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {statusMessage}
        </div>
      )}

      {/* Khu vực chọn trạng thái */}
      {showStatusEditor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cập nhật trạng thái hợp đồng
            </CardTitle>

            <CardDescription>
              Chọn trạng thái mới cho hợp đồng{" "}
              {contract.contract_number}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-status">
                Trạng thái mới
              </Label>


              <select
                id="contract-status"
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);
                  setStatusError(null);
                }}
                disabled={updatingStatus}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-72"
              >
                <option value="" disabled>
                  Chọn trạng thái
                </option>

                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>

            </div>

            {statusError && (
              <p className="text-sm text-red-600">
                {statusError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusEditor(false);
                  setStatusError(null);
                }}
                disabled={updatingStatus}
              >
                Hủy
              </Button>

              <Button
                onClick={() => {
                  if (!selectedStatus) {
                    setStatusError(
                      "Vui lòng chọn trạng thái hợp đồng."
                    );
                    return;
                  }

                  if (selectedStatus === contract.status) {
                    setStatusError(
                      "Trạng thái mới phải khác trạng thái hiện tại."
                    );
                    return;
                  }

                  setStatusError(null);
                  setConfirmOpen(true);
                }}
                disabled={
                  updatingStatus ||
                  !selectedStatus ||
                  selectedStatus === contract.status
                }
              >
                Cập nhật
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog xác nhận cập nhật */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!updatingStatus) {
            setConfirmOpen(open);
            if (open) setStatusError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Xác nhận cập nhật trạng thái
            </DialogTitle>

            <DialogDescription>
              Bạn có chắc chắn muốn đổi trạng thái hợp đồng{" "}
              <span className="font-semibold text-foreground">
                {contract.contract_number}
              </span>{" "}
              từ{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(contract.status).label}
              </span>{" "}
              sang{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(selectedStatus).label}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {statusError && (
            <p className="text-sm text-red-600">
              {statusError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setStatusError(null);
              }}
              disabled={updatingStatus}
            >
              Quay lại
            </Button>

            <Button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {updatingStatus
                ? "Đang cập nhật..."
                : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thông tin cơ bản của hợp đồng */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-blue-600">
                Thông tin hợp đồng
              </CardTitle>

              <CardDescription className="mt-1">
                Thông tin cơ bản của hợp đồng thuê phòng
              </CardDescription>
            </div>

            <Badge className={status.className}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Mã hợp đồng
              </p>
              <p className="mt-1 font-medium">
                {contract.contract_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Phòng thuê
              </p>
              <p className="mt-1 font-medium">
                {contract.rooms?.room_number ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Giá thuê theo hợp đồng
              </p>
              <p className="mt-1 font-semibold text-blue-600">
                {formatCurrency(String(contract.rent_price))}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Ngày bắt đầu
              </p>
              <p className="mt-1 font-medium">
                {formatDate(contract.start_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Ngày kết thúc
              </p>
              <p className="mt-1 font-medium">
                {formatDate(contract.end_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Ngày thanh toán hằng tháng
              </p>
              <p className="mt-1 font-medium">
                Ngày {contract.billing_day}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin phòng trọ */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-orange-600">
                Thông tin phòng trọ
              </CardTitle>

              <CardDescription>
                Thông tin phòng được sử dụng trong hợp đồng này
              </CardDescription>
            </div>

            <Link href={`/landlord/rooms/${contract.room_id}`} >
            <Button
              variant="outline"
              size="sm"
            >
              <Eye className="mr-2 size-4" />
              Xem chi tiết
            </Button>
            </Link>

          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Tên phòng
            </p>
            <p className="text-xl font-bold">
              {contract.rooms?.room_number ?? "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Diện tích
            </p>
            <p className="font-medium">
              {contract.rooms?.area != null
                ? `${contract.rooms.area} m²`
                : "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Sức chứa tối đa
            </p>
            <p className="font-medium">
              {contract.rooms?.max_occupants != null
                ? `${contract.rooms.max_occupants} người`
                : "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Giá thuê niêm yết hiện tại
            </p>
            <p className="font-medium">
              {contract.rooms?.listed_rent != null
                ? formatCurrency(
                    String(contract.rooms.listed_rent)
                  )
                : "Chưa cập nhật"}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Danh sách người thuê */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-violet-600">
            Danh sách người thuê
          </CardTitle>

          <CardDescription>
            Có {tenants.length} người trong hợp đồng
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="px-0">
          {tenants.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Chưa có người thuê trong hợp đồng này.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">
                      STT
                    </TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="pr-6 text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tenants.map((tenant, index) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="pl-6">
                        {index + 1}
                      </TableCell>

                      <TableCell className="font-medium">
                        {tenant.profiles?.full_name ??
                          "Chưa cập nhật"}
                      </TableCell>

                      <TableCell>
                        {tenant.profiles?.phone ??
                          "Chưa cập nhật"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tenant.role === "REPRESENTATIVE"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }
                        >
                          {tenant.role === "REPRESENTATIVE"
                            ? "Người đại diện"
                            : "Thành viên"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tenant.status === "ACTIVE"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }
                        >
                          {tenant.status === "ACTIVE"
                            ? "Đang tham gia"
                            : tenant.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <Link href={`/landlord/profiles/${tenant.profile_id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="mr-2 size-4" />
                              Xem chi tiết
                            </Button>
                        </Link>
                        
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
