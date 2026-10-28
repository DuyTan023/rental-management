"use client";

import { AlertTriangle, Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "INACTIVE";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type FormUpdateStatusRoomProps = {
  room: RoomWithCurrentContract;
  trigger: ReactElement;
};

const STATUS_OPTIONS: {
  value: RoomStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "AVAILABLE",
    label: "Còn trống",
    description: "Phòng có thể tiếp nhận người thuê.",
  },
  {
    value: "OCCUPIED",
    label: "Đang thuê",
    description: "Phòng đang có người thuê theo hợp đồng.",
  },
  {
    value: "MAINTENANCE",
    label: "Đang bảo trì",
    description: "Phòng đang sửa chữa hoặc bảo trì.",
  },
  {
    value: "INACTIVE",
    label: "Ngừng hoạt động",
    description: "Phòng tạm thời không được đưa vào sử dụng.",
  },
];

const STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: "Còn trống",
  OCCUPIED: "Đang thuê",
  MAINTENANCE: "Đang bảo trì",
  INACTIVE: "Ngừng hoạt động",
};

function getStatusError(
  currentStatus: RoomStatus,
  nextStatus: RoomStatus,
  hasActiveContract: boolean,
): string | null {
  if (currentStatus === nextStatus) {
    return "Trạng thái mới giống trạng thái hiện tại.";
  }

  // Phòng đang thuê được chuyển sang sửa chữa.
  if (currentStatus === "OCCUPIED" && nextStatus === "MAINTENANCE") {
    return null;
  }

  // Không tự chuyển sang đang thuê nếu chưa thông qua nghiệp vụ hợp đồng.
  if (nextStatus === "OCCUPIED") {
    if (!hasActiveContract) {
      return "Không thể chuyển sang Đang thuê khi phòng chưa có hợp đồng hiệu lực.";
    }

    if (currentStatus !== "MAINTENANCE") {
      return "Trạng thái Đang thuê cần được cập nhật theo nghiệp vụ hợp đồng.";
    }

    return null;
  }

  // Không cho đưa phòng về trạng thái không có người thuê
  // khi hợp đồng vẫn đang hiệu lực.
  if (
    hasActiveContract &&
    (nextStatus === "AVAILABLE" || nextStatus === "INACTIVE")
  ) {
    return "Phòng đang có hợp đồng thuê hiệu lực. Không thể chuyển sang Còn trống hoặc Ngừng hoạt động.";
  }

  return null;
}

export function FormUpdateStatusRoom({
  room,
  trigger,
}: FormUpdateStatusRoomProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasActiveContract = room.current_contract?.status === "ACTIVE";

  const statusError = getStatusError(room.status, status, hasActiveContract);

  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setStatus(room.status);
      setError("");
      setSuccess("");
    }
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    const validationError = getStatusError(
      room.status,
      status,
      hasActiveContract,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn chuyển phòng ${room.room_number} từ "${STATUS_LABELS[room.status]}" sang "${STATUS_LABELS[status]}" không?`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/landlord/rooms/${room.id.toString()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // Chỉ gửi trạng thái cần cập nhật.
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            "Không thể cập nhật trạng thái phòng. Vui lòng thử lại.",
        );
      }

      setSuccess("Cập nhật trạng thái phòng thành công.");
      setOpen(false);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái phòng.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái phòng</DialogTitle>
          <DialogDescription>
            Phòng {room.room_number}. Chọn trạng thái phù hợp với tình trạng sử
            dụng thực tế của phòng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor={`room-status-${room.id.toString()}`}
              className="text-sm font-medium"
            >
              Trạng thái phòng
            </label>

            <select
              id={`room-status-${room.id.toString()}`}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as RoomStatus);
                setError("");
              }}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {selectedStatus && (
              <p className="text-xs text-muted-foreground">
                {selectedStatus.description}
              </p>
            )}
          </div>

          {hasActiveContract && (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                Phòng đang có hợp đồng thuê hiệu lực
                {room.current_contract?.id
                  ? ` (#${room.current_contract.id})`
                  : ""}
                . Không nên thay đổi trạng thái phòng khi hợp đồng chưa được kết
                thúc hợp lệ.
              </p>
            </div>
          )}

          {statusError && (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{statusError}</p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {success}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || Boolean(statusError)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Lưu trạng thái
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
