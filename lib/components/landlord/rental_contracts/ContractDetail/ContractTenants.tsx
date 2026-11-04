
"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, UserRoundMinus, Users, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { RentalContractWithDetails } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

import FormAddTenant from "./FormAddTenant";

type Tenant = NonNullable<
  RentalContractWithDetails["contract_tenants"]
>[number];

type Props = {
  contractId: string;
  tenants: Tenant[];
  maxOccupants: number;
  onRefresh: () => Promise<void>;
};

export function ContractTenants({
  contractId,
  tenants,
  maxOccupants,
  onRefresh,
}: Props) {
  const [tenantToRemove, setTenantToRemove] =
    useState<Tenant | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const currentOccupants = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;

  const handleConfirmRemove = async () => {
    if (!tenantToRemove || isRemoving) return;

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_tenants/${tenantToRemove.id}`,
        {
          method: "PATCH",
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Không thể cho người thuê rời hợp đồng.",
        );
      }

      toast.success(
        result?.message || "Đã cho người thuê rời hợp đồng thành công.",
      );

      setTenantToRemove(null);

      // Tải lại danh sách sau khi cập nhật thành công.
      try {
        await onRefresh();
      } catch (refreshError) {
        console.error("Lỗi tải lại danh sách người thuê:", refreshError);
        toast.error(
          "Đã cập nhật người thuê nhưng không thể tải lại danh sách.",
        );
      }
    } catch (error) {
      console.error("Lỗi cho người thuê rời hợp đồng:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cho người thuê rời hợp đồng.",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <CardTitle className="text-lg">
                Danh sách người thuê
              </CardTitle>

              <CardDescription>
                Những người tham gia hợp đồng
              </CardDescription>

              <Badge variant="secondary" className="mt-2">
                {currentOccupants} người
              </Badge>
            </div>
          </div>

          <FormAddTenant
            contractId={contractId}
            currentOccupants={currentOccupants}
            maxOccupants={maxOccupants}
            onSuccess={onRefresh}
          />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="px-0 pt-2">
        {tenants.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />

            <p className="text-sm font-medium">
              Chưa có người thuê trong hợp đồng này.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Nhấn nút thêm người thuê để liên kết hồ sơ có sẵn
              hoặc tạo người thuê mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">STT</TableHead>
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
                      {tenant.profiles?.full_name ?? "Chưa cập nhật"}
                    </TableCell>

                    <TableCell>
                      {tenant.profiles?.phone ?? "Chưa cập nhật"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tenant.role === "REPRESENTATIVE"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
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
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-600"
                        }
                      >
                        {tenant.status === "ACTIVE"
                          ? "Đang tham gia"
                          : tenant.status === "LEFT"
                            ? "Đã rời đi"
                            : tenant.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/landlord/profiles/${tenant.profile_id}`}
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </Button>
                        </Link>

                        {tenant.status === "ACTIVE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setTenantToRemove(tenant)}
                          >
                            <UserRoundMinus className="mr-2 h-4 w-4" />
                            Cho rời
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog
        open={tenantToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) {
            setTenantToRemove(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRoundMinus className="h-5 w-5 text-red-600" />
              Xác nhận cho người thuê rời hợp đồng
            </DialogTitle>

            <DialogDescription>
              Bạn có chắc chắn muốn cho người thuê này rời khỏi hợp đồng
              không? Hồ sơ và tài khoản của họ sẽ không bị xóa.
              {tenantToRemove?.role === "REPRESENTATIVE" && (
                <>
                  {" "}
                  Một người thuê đang hoạt động khác sẽ được chuyển thành
                  người đại diện nếu còn người ở lại.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {tenantToRemove && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium">
                {tenantToRemove.profiles?.full_name ?? "Chưa cập nhật"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {tenantToRemove.profiles?.phone ??
                  "Chưa cập nhật số điện thoại"}
              </p>

              <div className="mt-3">
                <Badge variant="outline">
                  {tenantToRemove.role === "REPRESENTATIVE"
                    ? "Người đại diện"
                    : "Thành viên"}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isRemoving}
              onClick={() => setTenantToRemove(null)}
            >
              Hủy
            </Button>

            <Button
              variant="destructive"
              disabled={isRemoving || !tenantToRemove}
              onClick={handleConfirmRemove}
            >
              {isRemoving ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserRoundMinus className="mr-2 h-4 w-4" />
                  Xác nhận cho rời
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
