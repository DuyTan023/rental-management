
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  XCircle,
  Home,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ==================================================
// Types
// ==================================================

type NotificationStatus = "PENDING" | "COMPLETED" | "CANCELLED";
type StatusFilter = "ALL" | NotificationStatus;

interface OvernightStay {
  id: string;
  contract_id: string;
  tenant_profile_id: string;

  guest_name: string;
  guest_identity_number?: string | null;
  guest_phone?: string | null;
  guest_address?: string | null;

  check_in_at: string;
  check_out_at: string;
  actual_check_out_at?: string | null;

  notification_status: NotificationStatus;

  notified_by?: string | null;
  notification_at?: string | null;

  note?: string | null;
  created_at: string;
  updated_at: string;

  rental_contracts?: {
    id: string;
    contract_number?: string | null;
    rooms?: {
      id: string;
      room_number?: string | null;
      name?: string | null;
    } | null;
  } | null;

  profiles?: {
    id: string;
    full_name?: string | null;
    phone?: string | null;
    users?: {
      full_name?: string | null;
      email?: string | null;
    } | null;
  } | null;

  users?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Statistics {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

const PAGE_SIZE = 10;

const initialPagination: Pagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const initialStatistics: Statistics = {
  total: 0,
  pending: 0,
  completed: 0,
  cancelled: 0,
};

// ==================================================
// Helpers
// ==================================================

function getErrorMessage(data: any, fallback: string) {
  return data?.message || data?.error || fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: NotificationStatus) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "COMPLETED":
      return "Đã xác nhận";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function StatusBadge({
  status,
}: {
  status: NotificationStatus;
}) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Clock className="mr-1 h-3 w-3" />
          Chờ xác nhận
        </Badge>
      );

    case "COMPLETED":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Đã xác nhận
        </Badge>
      );

    case "CANCELLED":
      return (
        <Badge variant="secondary">
          <XCircle className="mr-1 h-3 w-3" />
          Đã hủy
        </Badge>
      );

    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getRoomName(item: OvernightStay) {
  const room = item.rental_contracts?.rooms;

  return room?.room_number || room?.name || "Chưa xác định";
}

function getTenantName(item: OvernightStay) {
  return (
    item.profiles?.full_name ||
    item.profiles?.users?.full_name ||
    item.users?.full_name ||
    "Chưa xác định"
  );
}

function getTenantEmail(item: OvernightStay) {
  return (
    item.profiles?.users?.email ||
    item.users?.email ||
    ""
  );
}

function getTenantPhone(item: OvernightStay) {
  return item.profiles?.phone || "";
}

function extractList(data: any): OvernightStay[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

// ==================================================
// Page
// ==================================================

export default function LandlordOvernightStaysPage() {
  // Data
  const [items, setItems] = useState<OvernightStay[]>([]);
  const [selectedItem, setSelectedItem] =
    useState<OvernightStay | null>(null);

  // Statistics
  const [statistics, setStatistics] =
    useState<Statistics>(initialStatistics);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);

  // Filters
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [search, setSearch] = useState("");

  // Loading
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Dialogs
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<OvernightStay | null>(null);

  // ==================================================
  // Fetch list
  // ==================================================

  const fetchItems = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/landlord/overnight-stays?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result,
            "Không thể tải danh sách thông báo lưu trú."
          )
        );
      }

      const responseData = result.data;

      const list = extractList(responseData);

      setItems(list);

      const paginationData = responseData?.pagination;

      if (paginationData) {
        const total = Number(
          paginationData.total ?? list.length
        );

        setPagination({
          page: Number(paginationData.page ?? page),
          limit: Number(paginationData.limit ?? PAGE_SIZE),
          total,
          totalPages: Math.max(
            1,
            Number(
              paginationData.totalPages ??
                Math.ceil(total / PAGE_SIZE)
            )
          ),
        });
      } else {
        setPagination({
          page,
          limit: PAGE_SIZE,
          total: list.length,
          totalPages: 1,
        });
      }
    } catch (error) {
      console.error("Fetch overnight stays error:", error);

      setItems([]);

      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // ==================================================
  // Fetch statistics
  // ==================================================

  const fetchStatistics = useCallback(async () => {
    try {
      /**
       * Mỗi request chỉ cần lấy pagination.total.
       * Không cần tải toàn bộ dữ liệu chỉ để thống kê.
       */

      const statuses: Array<NotificationStatus | "ALL"> = [
        "ALL",
        "PENDING",
        "COMPLETED",
        "CANCELLED",
      ];

      const results = await Promise.all(
        statuses.map(async (status) => {
          const params = new URLSearchParams({
            page: "1",
            limit: "1",
          });

          if (status !== "ALL") {
            params.set("status", status);
          }

          const response = await fetch(
            `/api/landlord/overnight-stays?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(
              getErrorMessage(result, "Không thể tải thống kê.")
            );
          }

          const data = result.data;

          return Number(
            data?.pagination?.total ??
              data?.pagination?.totalCount ??
              extractList(data).length
          );
        })
      );

      setStatistics({
        total: results[0],
        pending: results[1],
        completed: results[2],
        cancelled: results[3],
      });
    } catch (error) {
      console.error("Fetch statistics error:", error);
    }
  }, []);

  // ==================================================
  // Initial loading
  // ==================================================

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // ==================================================
  // Search
  // ==================================================

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      return (
        item.guest_name?.toLowerCase().includes(keyword) ||
        item.guest_identity_number
          ?.toLowerCase()
          .includes(keyword) ||
        item.guest_phone?.toLowerCase().includes(keyword) ||
        getRoomName(item).toLowerCase().includes(keyword) ||
        getTenantName(item).toLowerCase().includes(keyword) ||
        item.rental_contracts?.contract_number
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [items, search]);

  // ==================================================
  // Refresh
  // ==================================================

  async function handleRefresh() {
    await Promise.all([
      fetchItems(),
      fetchStatistics(),
    ]);
  }

  // ==================================================
  // Detail
  // ==================================================

  async function openDetail(item: OvernightStay) {
    setSelectedItem(item);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/landlord/overnight-stays/${item.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result,
            "Không thể tải chi tiết thông báo."
          )
        );
      }

      setSelectedItem(result.data);
    } catch (error) {
      console.error("Fetch detail error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // ==================================================
  // Confirm notification
  // ==================================================

  function openConfirmDialog(item: OvernightStay) {
    if (item.notification_status !== "PENDING") {
      toast.error("Thông báo này không còn ở trạng thái chờ xác nhận.");
      return;
    }

    setConfirmTarget(item);
    setConfirmOpen(true);
  }

  async function handleConfirmNotification() {
    if (!confirmTarget) return;

    setConfirming(true);

    try {
      const response = await fetch(
        `/api/landlord/overnight-stays/${confirmTarget.id}/notification`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result,
            "Không thể xác nhận thông báo lưu trú."
          )
        );
      }

      toast.success("Đã xác nhận xử lý thông báo lưu trú.");

      setConfirmOpen(false);
      setConfirmTarget(null);

      if (selectedItem?.id === confirmTarget.id) {
        setSelectedItem(result.data ?? {
          ...selectedItem,
          notification_status: "COMPLETED",
          notification_at: new Date().toISOString(),
        });
      }

      await Promise.all([
        fetchItems(),
        fetchStatistics(),
      ]);
    } catch (error) {
      console.error("Confirm notification error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi xác nhận."
      );
    } finally {
      setConfirming(false);
    }
  }

  // ==================================================
  // Filter
  // ==================================================

  function handleStatusChange(value: string) {
    if (
      value !== "ALL" &&
      value !== "PENDING" &&
      value !== "COMPLETED" &&
      value !== "CANCELLED"
    ) {
      return;
    }

    setPage(1);
    setStatusFilter(value as StatusFilter);
  }

  // ==================================================
  // Render
  // ==================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý khách lưu trú
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi và xử lý thông báo khách ở qua đêm của người thuê.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Làm mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Tổng thông báo
              </p>
              <p className="mt-1 text-2xl font-bold">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Chờ xử lý
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {statistics.pending}
              </p>
            </div>

            <Clock className="h-6 w-6 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Đã xác nhận
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {statistics.completed}
              </p>
            </div>

            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Đã hủy
              </p>
              <p className="mt-1 text-2xl font-bold text-muted-foreground">
                {statistics.cancelled}
              </p>
            </div>

            <XCircle className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Danh sách thông báo lưu trú</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Danh sách các thông báo được gửi từ người thuê.
            </p>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Tìm tên khách, phòng, người thuê, số giấy tờ..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  Tất cả trạng thái
                </SelectItem>
                <SelectItem value="PENDING">
                  Chờ xác nhận
                </SelectItem>
                <SelectItem value="COMPLETED">
                  Đã xác nhận
                </SelectItem>
                <SelectItem value="CANCELLED">
                  Đã hủy
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-muted p-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>

              <p className="font-medium">
                {search
                  ? "Không tìm thấy thông báo phù hợp"
                  : statusFilter !== "ALL"
                    ? "Không có thông báo ở trạng thái này"
                    : "Chưa có thông báo lưu trú"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Các thông báo do người thuê gửi sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách lưu trú</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Người thuê</TableHead>
                      <TableHead>Thời gian đến</TableHead>
                      <TableHead>Thời gian rời đi</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        {/* Guest */}
                        <TableCell>
                          <div className="min-w-[160px]">
                            <p className="font-medium">
                              {item.guest_name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {item.guest_phone || "Không có SĐT"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Room */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />

                            <span className="font-medium">
                              {getRoomName(item)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Tenant */}
                        <TableCell>
                          <div className="min-w-[140px]">
                            <p className="font-medium">
                              {getTenantName(item)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {getTenantPhone(item) ||
                                getTenantEmail(item) ||
                                "—"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Check in */}
                        <TableCell className="min-w-[145px]">
                          {formatDateTime(item.check_in_at)}
                        </TableCell>

                        {/* Check out */}
                        <TableCell className="min-w-[145px]">
                          {formatDateTime(item.check_out_at)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge
                            status={item.notification_status}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Xem chi tiết"
                              onClick={() => openDetail(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {item.notification_status === "PENDING" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                title="Xác nhận đã xử lý"
                                onClick={() =>
                                  openConfirmDialog(item)
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-5 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  Tổng {pagination.total} thông báo
                </p>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() =>
                      setPage((current) => current - 1)
                    }
                  >
                    Trước
                  </Button>

                  <span className="text-sm">
                    Trang {page} / {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page >= pagination.totalPages || loading
                    }
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ==================================================
          Detail dialog
      ================================================== */}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!detailLoading) {
            setDetailOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết thông báo lưu trú</DialogTitle>

            <DialogDescription>
              Thông tin khách và người thuê đã gửi thông báo.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-5 py-2">
              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Trạng thái xử lý
                  </p>

                  <div className="mt-2">
                    <StatusBadge
                      status={selectedItem.notification_status}
                    />
                  </div>
                </div>

                <Users className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* Room and contract */}
              <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Phòng
                  </p>

                  <p className="mt-1 font-medium">
                    {getRoomName(selectedItem)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Mã hợp đồng
                  </p>

                  <p className="mt-1 font-medium">
                    {selectedItem.rental_contracts?.contract_number ||
                      `#${selectedItem.contract_id}`}
                  </p>
                </div>
              </div>

              {/* Guest info */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Thông tin khách lưu trú
                </h3>

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Họ và tên
                    </p>

                    <p className="font-medium">
                      {selectedItem.guest_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Số giấy tờ tùy thân
                    </p>

                    <p className="font-medium">
                      {selectedItem.guest_identity_number ||
                        "Chưa cung cấp"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Số điện thoại
                    </p>

                    <p className="font-medium">
                      {selectedItem.guest_phone || "Chưa cung cấp"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Địa chỉ thường trú
                    </p>

                    <p className="font-medium">
                      {selectedItem.guest_address || "Chưa cung cấp"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant info */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">
                  Thông tin người thuê gửi thông báo
                </h3>

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Người thuê
                    </p>

                    <p className="font-medium">
                      {getTenantName(selectedItem)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Số điện thoại người thuê
                    </p>

                    <p className="font-medium">
                      {getTenantPhone(selectedItem) || "Chưa cung cấp"}
                    </p>
                  </div>
                </div>

                {getTenantEmail(selectedItem) && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email người thuê
                    </p>

                    <p className="font-medium">
                      {getTenantEmail(selectedItem)}
                    </p>
                  </div>
                )}
              </div>

              {/* Stay time */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">
                  Thời gian lưu trú
                </h3>

                <div className="grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Thời gian đến
                    </p>

                    <p className="mt-1 font-medium">
                      {formatDateTime(selectedItem.check_in_at)}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Thời gian rời đi dự kiến
                    </p>

                    <p className="mt-1 font-medium">
                      {formatDateTime(selectedItem.check_out_at)}
                    </p>
                  </div>
                </div>

                {selectedItem.actual_check_out_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian rời đi thực tế
                    </p>

                    <p className="font-medium">
                      {formatDateTime(
                        selectedItem.actual_check_out_at
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />

                  <h3 className="font-semibold">Ghi chú</h3>
                </div>

                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {selectedItem.note || "Không có ghi chú."}
                </p>
              </div>

              {/* Processing information */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold">
                  Thông tin xử lý
                </h3>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Thời gian chủ trọ xác nhận
                  </p>

                  <p className="font-medium">
                    {formatDateTime(selectedItem.notification_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Ngày tạo thông báo
                  </p>

                  <p className="font-medium">
                    {formatDateTime(selectedItem.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
              disabled={detailLoading}
            >
              Đóng
            </Button>

            {selectedItem?.notification_status === "PENDING" && (
              <Button
                onClick={() => openConfirmDialog(selectedItem)}
                disabled={detailLoading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xác nhận đã xử lý
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================
          Confirm dialog
      ================================================== */}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!confirming) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận đã xử lý thông báo?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Bạn đã thực hiện các thủ tục thông báo lưu trú cần thiết
              cho khách{" "}
              <strong>{confirmTarget?.guest_name}</strong> tại phòng{" "}
              <strong>
                {confirmTarget ? getRoomName(confirmTarget) : ""}
              </strong>
              ?

              <br />
              <br />

              Sau khi xác nhận, thông báo sẽ chuyển sang trạng thái
              "Đã xác nhận" và người thuê không thể chỉnh sửa hoặc hủy
              thông báo này nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>
              Kiểm tra lại
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={confirming}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmNotification();
              }}
            >
              {confirming && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Xác nhận đã xử lý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
