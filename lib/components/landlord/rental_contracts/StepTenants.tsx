"use client";

import { Info, Plus, Trash2, UserRound, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

// ============================================================
// TYPES
// ============================================================

export type ContractTenantRole = "REPRESENTATIVE" | "MEMBER";

export type TenantFormData = {
  id: string;
  full_name: string;
  phone: string;
  identity_number: string;
  date_of_birth: string;
  province_code: string;
  ward_code: string;
  address_detail: string;
  role: ContractTenantRole;
};

type StepTenantsProps = {
  tenants: TenantFormData[];
  onAddTenant: () => void;
  onRemoveTenant: (id: string) => void;
  onTenantChange: (
    id: string,
    field: keyof TenantFormData,
    value: string,
  ) => void;
  onSetRepresentative: (id: string) => void;
};

// ============================================================
// COMPONENT
// ============================================================

export default function StepTenants({
  tenants,
  onAddTenant,
  onRemoveTenant,
  onTenantChange,
  onSetRepresentative,
}: StepTenantsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              2. Thông tin người thuê
            </CardTitle>

            <p className="mt-2 text-sm text-muted-foreground">
              Nhập thông tin những người cùng thuê phòng.
            </p>
          </div>

          <Badge variant="secondary">{tenants.length} người thuê</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />

          <p>
            Mỗi hợp đồng cần một người đại diện. Những người còn lại được ghi
            nhận là thành viên. Người đại diện có thể thay đổi trước khi tạo hợp
            đồng.
          </p>
        </div>

        {tenants.map((tenant, index) => (
          <Card key={tenant.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold">Người thuê {index + 1}</p>

                    <p className="text-xs text-muted-foreground">
                      {tenant.role === "REPRESENTATIVE"
                        ? "Người đại diện hợp đồng"
                        : "Thành viên"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {tenant.role === "REPRESENTATIVE" && <Badge>Đại diện</Badge>}

                  {tenants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemoveTenant(tenant.id)}
                      aria-label={`Xóa người thuê ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Vai trò */}

              <div className="space-y-3">
                <Label>Vai trò trong hợp đồng</Label>

                <RadioGroup
                  value={tenant.role}
                  onValueChange={() => onSetRepresentative(tenant.id)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Label
                    htmlFor={`representative-${tenant.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                      tenant.role === "REPRESENTATIVE"
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <RadioGroupItem
                      id={`representative-${tenant.id}`}
                      value="REPRESENTATIVE"
                      className="mt-1"
                    />

                    <div>
                      <p className="font-medium">Người đại diện</p>

                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        Người đại diện cho nhóm thuê.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor={`member-${tenant.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                      tenant.role === "MEMBER"
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <RadioGroupItem
                      id={`member-${tenant.id}`}
                      value="MEMBER"
                      className="mt-1"
                    />

                    <div>
                      <p className="font-medium">Thành viên</p>

                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        Người cùng thuê phòng.
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <Separator />

              {/* Thông tin cá nhân */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    placeholder="Nhập họ và tên"
                    value={tenant.full_name}
                    onChange={(e) =>
                      onTenantChange(tenant.id, "full_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    placeholder="Ví dụ: 0912345678"
                    value={tenant.phone}
                    onChange={(e) =>
                      onTenantChange(tenant.id, "phone", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Số CCCD</Label>

                  <Input
                    placeholder="Nhập số CCCD"
                    value={tenant.identity_number}
                    onChange={(e) =>
                      onTenantChange(
                        tenant.id,
                        "identity_number",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày sinh</Label>

                  <Input
                    type="date"
                    value={tenant.date_of_birth}
                    onChange={(e) =>
                      onTenantChange(tenant.id, "date_of_birth", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tỉnh / Thành phố</Label>

                  <Input
                    placeholder="Nhập mã tỉnh / thành phố"
                    value={tenant.province_code}
                    onChange={(e) =>
                      onTenantChange(tenant.id, "province_code", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phường / Xã</Label>

                  <Input
                    placeholder="Nhập mã phường / xã"
                    value={tenant.ward_code}
                    onChange={(e) =>
                      onTenantChange(tenant.id, "ward_code", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Địa chỉ chi tiết</Label>

                  <Input
                    placeholder="Số nhà, tên đường..."
                    value={tenant.address_detail}
                    onChange={(e) =>
                      onTenantChange(
                        tenant.id,
                        "address_detail",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Thêm người thuê */}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={onAddTenant}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm người thuê
        </Button>

        <p className="text-xs text-muted-foreground">
          Thông tin cá nhân tương ứng với model profiles. Vai trò tương ứng với
          contract_tenants.role.
        </p>
      </CardContent>
    </Card>
  );
}
