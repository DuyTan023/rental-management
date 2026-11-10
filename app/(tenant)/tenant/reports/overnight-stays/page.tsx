"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  House,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import { toast } from "sonner";
import Link from "next/link";

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
}

interface ContractInfo {
  id: string;
  contract_number?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface StayForm {
  guest_name: string;
  guest_identity_number: string;
  guest_phone: string;
  guest_address: string;
  check_in_at: string;
  check_out_at: string;
  note: string;
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

const initialForm: StayForm = {
  guest_name: "",
  guest_identity_number: "",
  guest_phone: "",
  guest_address: "",
  check_in_at: "",
  check_out_at: "",
  note: "",
};

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

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function toISOString(value: string) {
  return new Date(value).toISOString();
}

function isNotificationStatus(
  value: unknown
): value is NotificationStatus {
  return (
    value === "PENDING" ||
    value === "COMPLETED" ||
    value === "CANCELLED"
  );
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

// ==================================================
// Page
// ==================================================

export default function TenantOvernightStaysPage() {
  // --------------------------------------------------
  // Data states
  // --------------------------------------------------

  const [items, setItems] = useState<OvernightStay[]>([]);
  const [contract, setContract] = useState<ContractInfo | null>(null);

  const [statistics, setStatistics] =
    useState<Statistics>(initialStatistics);

  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);

  // --------------------------------------------------
  // Loading states
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [contractLoading, setContractLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // --------------------------------------------------
  // Filter states
  // --------------------------------------------------

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // --------------------------------------------------
  // Create / Edit dialog
  // --------------------------------------------------

  const [formOpen, setFormOpen] = useState(false);

  const [editingItem, setEditingItem] =
    useState<OvernightStay | null>(null);

  const [form, setForm] = useState<StayForm>(initialForm);

  // --------------------------------------------------
  // Detail dialog
  // --------------------------------------------------

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedItem, setSelectedItem] =
    useState<OvernightStay | null>(null);

  // --------------------------------------------------
  // Cancel dialog
  // --------------------------------------------------

  const [cancelOpen, setCancelOpen] = useState(false);

  const [cancelTarget, setCancelTarget] =
    useState<OvernightStay | null>(null);

  // ==================================================
  // Fetch contract
  // ==================================================

  const fetchContract = useCallback(async () => {
    setContractLoading(true);

    try {
      const response = await fetch("/api/tenant/meter_readings", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result,
            "Không thể lấy thông tin hợp đồng."
          )
        );
      }

      const contractData = result.data?.contract;

      if (!contractData?.id) {
        setContract(null);
        return;
      }

      setContract({
        id: String(contractData.id),
        contract_number: contractData.contract_number ?? null,
        start_date: contractData.start_date ?? null,
        end_date: contractData.end_date ?? null,
      });
    } catch (error) {
      console.error("Fetch contract error:", error);

      setContract(null);
    } finally {
      setContractLoading(false);
    }
  }, []);

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
        `/api/tenant/overnight-stays?${params.toString()}`,
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

      /**
       * Cấu trúc response từ route:
       *
       * {
       *   success: true,
       *   message: "...",
       *   data: {
       *     data: [],
       *     pagination: {},
       *     statistics: {}
       *   }
       * }
       *
       * Vì vậy danh sách nằm tại result.data.data.
       */

      const responseData = result.data;

      // Lấy danh sách
      let list: OvernightStay[] = [];

      if (Array.isArray(responseData)) {
        // Trường hợp API trả trực tiếp mảng
        list = responseData;
      } else if (Array.isArray(responseData?.data)) {
        // Trường hợp API trả { data: { data: [] } }
        list = responseData.data;
      } else if (Array.isArray(responseData?.items)) {
        list = responseData.items;
      } else if (Array.isArray(responseData?.records)) {
        list = responseData.records;
      }

      setItems(list);

      // Lấy pagination
      const paginationData = responseData?.pagination;

      if (paginationData) {
        const total = Number(paginationData.total ?? list.length);

        const totalPages = Number(
          paginationData.totalPages ??
            Math.ceil(total / PAGE_SIZE) ??
            1
        );

        setPagination({
          page: Number(paginationData.page ?? page),
          limit: Number(paginationData.limit ?? PAGE_SIZE),
          total,
          totalPages: Math.max(1, totalPages),
        });
      } else {
        setPagination({
          page,
          limit: PAGE_SIZE,
          total: list.length,
          totalPages: 1,
        });
      }

      // Lấy thống kê từ API
      const statisticsData = responseData?.statistics;

      if (statisticsData) {
        setStatistics({
          total: Number(statisticsData.total ?? 0),
          pending: Number(statisticsData.pending ?? 0),
          completed: Number(statisticsData.completed ?? 0),
          cancelled: Number(statisticsData.cancelled ?? 0),
        });
      } else {
        // Dự phòng nếu API chưa trả statistics
        setStatistics({
          total: list.length,
          pending: list.filter(
            (item) => item.notification_status === "PENDING"
          ).length,
          completed: list.filter(
            (item) => item.notification_status === "COMPLETED"
          ).length,
          cancelled: list.filter(
            (item) => item.notification_status === "CANCELLED"
          ).length,
        });
      }
    } catch (error) {
      console.error("Fetch overnight stays error:", error);

      setItems([]);
      setPagination(initialPagination);
      setStatistics(initialStatistics);

      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải danh sách."
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // ==================================================
  // Initial loading
  // ==================================================

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
        item.guest_phone?.toLowerCase().includes(keyword)
      );
    });
  }, [items, search]);

  // ==================================================
  // Open create dialog
  // ==================================================

  function openCreateDialog() {
    setEditingItem(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  // ==================================================
  // Open edit dialog
  // ==================================================

  function openEditDialog(item: OvernightStay) {
    if (item.notification_status !== "PENDING") {
      toast.error("Chỉ có thể chỉnh sửa thông báo đang chờ xác nhận.");
      return;
    }

    setEditingItem(item);

    setForm({
      guest_name: item.guest_name ?? "",
      guest_identity_number: item.guest_identity_number ?? "",
      guest_phone: item.guest_phone ?? "",
      guest_address: item.guest_address ?? "",
      check_in_at: toDateTimeLocal(item.check_in_at),
      check_out_at: toDateTimeLocal(item.check_out_at),
      note: item.note ?? "",
    });

    setFormOpen(true);
  }

  // ==================================================
  // Update form
  // ==================================================

  function updateForm<K extends keyof StayForm>(
    key: K,
    value: StayForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ==================================================
  // Submit create / edit
  // ==================================================

  async function handleSubmit() {
    const guestName = form.guest_name.trim();

    if (!guestName) {
      toast.error("Vui lòng nhập họ tên khách.");
      return;
    }

    if (!form.check_in_at || !form.check_out_at) {
      toast.error("Vui lòng chọn thời gian đến và rời đi.");
      return;
    }

    const checkIn = new Date(form.check_in_at);
    const checkOut = new Date(form.check_out_at);

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime())
    ) {
      toast.error("Thời gian không hợp lệ.");
      return;
    }

    if (checkOut <= checkIn) {
      toast.error("Thời gian rời đi phải sau thời gian đến.");
      return;
    }

    if (!editingItem && !contract?.id) {
      toast.error("Không tìm thấy hợp đồng thuê đang hoạt động.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        guest_name: guestName,
        guest_identity_number:
          form.guest_identity_number.trim() || null,
        guest_phone: form.guest_phone.trim() || null,
        guest_address: form.guest_address.trim() || null,
        check_in_at: toISOString(form.check_in_at),
        check_out_at: toISOString(form.check_out_at),
        note: form.note.trim() || null,

        ...(!editingItem && {
          contract_id: contract!.id,
        }),
      };

      const url = editingItem
        ? `/api/tenant/overnight-stays/${editingItem.id}`
        : "/api/tenant/overnight-stays";

      const response = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result,
            editingItem
              ? "Không thể cập nhật thông báo."
              : "Không thể tạo thông báo."
          )
        );
      }

      toast.success(
        editingItem
          ? "Cập nhật thông báo thành công."
          : "Gửi thông báo thành công."
      );

      setFormOpen(false);
      setEditingItem(null);
      setForm(initialForm);

      await fetchItems();
    } catch (error) {
      console.error("Submit overnight stay error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi lưu thông báo."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // View detail
  // ==================================================

  async function openDetail(item: OvernightStay) {
    setSelectedItem(item);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/tenant/overnight-stays/${item.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result, "Không thể tải chi tiết thông báo.")
        );
      }

      setSelectedItem(result.data);
    } catch (error) {
      console.error("Fetch detail error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết thông báo."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // ==================================================
  // Cancel notification
  // ==================================================

  async function handleCancel() {
    if (!cancelTarget) return;

    setSaving(true);

    try {
      const response = await fetch(
        `/api/tenant/overnight-stays/${cancelTarget.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result, "Không thể hủy thông báo.")
        );
      }

      toast.success("Đã hủy thông báo.");

      setCancelOpen(false);
      setCancelTarget(null);

      await fetchItems();
    } catch (error) {
      console.error("Cancel overnight stay error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi hủy thông báo."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // Change status filter
  // ==================================================



  function handleStatusFilterChange(value: StatusFilter | null) {
  if (value === null) return;

  setPage(1);
  setStatusFilter(value);
}

  // ==================================================
  // Render
  // ==================================================

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="mt-5">

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <House size={16} />
            <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
            <ChevronRight size={14} />
          <span className="text-blue-600">Chi tiết phòng</span>
        </div>
          <div className="flex items-center gap-2 mt-3">
            <Users className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold tracking-tight">
              Khách ở qua đêm
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý và gửi thông báo về khách lưu trú qua đêm tại phòng thuê.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          disabled={!contract?.id || contractLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo thông báo
        </Button>
      </div>

      {/* Contract information */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Hợp đồng đang thuê
              </p>

              <p className="font-semibold">
                {contractLoading
                  ? "Đang tải thông tin hợp đồng..."
                  : contract?.contract_number
                    ? contract.contract_number
                    : contract?.id
                      ? `Hợp đồng #${contract.id}`
                      : "Chưa tìm thấy hợp đồng"}
              </p>
            </div>
          </div>

          {contract?.id ? (
            <Badge className="w-fit bg-green-100 text-green-700 hover:bg-green-100">
              Đang hoạt động
            </Badge>
          ) : (
            <Badge variant="secondary">
              Không có hợp đồng
            </Badge>
          )}
        </CardContent>
      </Card>

      {!contract?.id && !contractLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bạn chưa có hợp đồng thuê đang hoạt động. Vui lòng liên hệ chủ trọ
          để kiểm tra thông tin hợp đồng trước khi tạo thông báo.
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                Chờ xác nhận
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
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Danh sách thông báo</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi lịch sử khách đến lưu trú tại phòng.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchItems}
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Tìm theo tên, số giấy tờ hoặc số điện thoại..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[190px]">
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
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-muted p-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>

              <p className="font-medium">
                {search
                  ? "Không tìm thấy thông báo phù hợp"
                  : statusFilter !== "ALL"
                    ? "Không có thông báo ở trạng thái này"
                    : "Chưa có thông báo nào"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tạo thông báo khi có khách đến lưu trú qua đêm.
              </p>

              {!search && statusFilter === "ALL" && contract?.id && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={openCreateDialog}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo thông báo đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thông tin khách</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="min-w-[150px]">
                              <p className="font-medium">
                                {item.guest_name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {item.guest_phone || "Không có SĐT"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="min-w-[150px]">
                          {formatDateTime(item.check_in_at)}
                        </TableCell>

                        <TableCell className="min-w-[150px]">
                          {formatDateTime(item.check_out_at)}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={item.notification_status}
                          />
                        </TableCell>

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
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Chỉnh sửa"
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  title="Hủy thông báo"
                                  onClick={() => {
                                    setCancelTarget(item);
                                    setCancelOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
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
                    onClick={() => setPage((current) => current - 1)}
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
                    onClick={() => setPage((current) => current + 1)}
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
          Create / Edit Dialog
      ================================================== */}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setFormOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? "Chỉnh sửa thông báo"
                : "Thông báo khách ở qua đêm"}
            </DialogTitle>

            <DialogDescription>
              Nhập thông tin khách và thời gian lưu trú dự kiến.
              {editingItem
                ? " Bạn chỉ có thể chỉnh sửa khi thông báo đang chờ xác nhận."
                : " Chủ trọ sẽ tiếp nhận và xử lý thông báo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Guest name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Họ và tên khách{" "}
                <span className="text-destructive">*</span>
              </label>

              <Input
                placeholder="Nhập họ và tên khách"
                value={form.guest_name}
                onChange={(event) =>
                  updateForm("guest_name", event.target.value)
                }
                maxLength={255}
                disabled={saving}
              />
            </div>

            {/* Identity and phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Số giấy tờ tùy thân
                </label>

                <Input
                  placeholder="Nhập số giấy tờ"
                  value={form.guest_identity_number}
                  onChange={(event) =>
                    updateForm(
                      "guest_identity_number",
                      event.target.value
                    )
                  }
                  maxLength={50}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Số điện thoại
                </label>

                <Input
                  placeholder="Nhập số điện thoại"
                  value={form.guest_phone}
                  onChange={(event) =>
                    updateForm("guest_phone", event.target.value)
                  }
                  maxLength={20}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Địa chỉ thường trú
              </label>

              <Textarea
                placeholder="Nhập địa chỉ của khách (nếu có)"
                value={form.guest_address}
                onChange={(event) =>
                  updateForm("guest_address", event.target.value)
                }
                rows={2}
                disabled={saving}
              />
            </div>

            {/* Check in / Check out */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Thời gian đến{" "}
                  <span className="text-destructive">*</span>
                </label>

                <Input
                  type="datetime-local"
                  value={form.check_in_at}
                  onChange={(event) =>
                    updateForm("check_in_at", event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Thời gian rời đi{" "}
                  <span className="text-destructive">*</span>
                </label>

                <Input
                  type="datetime-local"
                  value={form.check_out_at}
                  onChange={(event) =>
                    updateForm("check_out_at", event.target.value)
                  }
                  min={form.check_in_at || undefined}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ghi chú
              </label>

              <Textarea
                placeholder="Nhập ghi chú thêm (nếu có)"
                value={form.note}
                onChange={(event) =>
                  updateForm("note", event.target.value)
                }
                rows={3}
                disabled={saving}
              />
            </div>

            {/* Notice */}
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Lưu ý
              </p>

              <p className="mt-1">
                Vui lòng cung cấp thông tin chính xác để chủ trọ tiếp nhận
                và thực hiện các thủ tục lưu trú cần thiết.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Đóng
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {editingItem ? "Lưu thay đổi" : "Gửi thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================
          Detail Dialog
      ================================================== */}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!detailLoading) {
            setDetailOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Chi tiết thông báo</DialogTitle>

            <DialogDescription>
              Thông tin khách lưu trú qua đêm.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-5 py-2">
              {/* Status */}
              <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
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

              {/* Guest information */}
              <div className="space-y-4">
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
                      Địa chỉ
                    </p>

                    <p className="font-medium">
                      {selectedItem.guest_address || "Chưa cung cấp"}
                    </p>
                  </div>
                </div>

                {/* Stay time */}
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
                      Thời gian rời đi
                    </p>

                    <p className="mt-1 font-medium">
                      {formatDateTime(selectedItem.check_out_at)}
                    </p>
                  </div>
                </div>

                {/* Actual checkout */}
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

                {/* Notification time */}
                {selectedItem.notification_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian chủ trọ xác nhận
                    </p>

                    <p className="font-medium">
                      {formatDateTime(selectedItem.notification_at)}
                    </p>
                  </div>
                )}

                {/* Note */}
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ghi chú
                    </p>

                    <p className="whitespace-pre-wrap font-medium">
                      {selectedItem.note || "Không có ghi chú"}
                    </p>
                  </div>
                </div>

                {/* Created at */}
                <div className="border-t pt-3 text-xs text-muted-foreground">
                  Ngày tạo: {formatDateTime(selectedItem.created_at)}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </div>
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
                onClick={() => {
                  setDetailOpen(false);
                  openEditDialog(selectedItem);
                }}
                disabled={detailLoading}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================
          Cancel confirmation
      ================================================== */}

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setCancelOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hủy thông báo này?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy thông báo của khách{" "}
              <strong>{cancelTarget?.guest_name}</strong> không?

              <br />

              Thông tin sẽ được giữ lại trong lịch sử và không thể chỉnh sửa
              sau khi hủy.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Không, giữ lại
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                handleCancel();
              }}
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}