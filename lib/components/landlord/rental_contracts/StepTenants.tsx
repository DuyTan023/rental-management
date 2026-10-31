
"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  getProvinces,
  getWards,
  type Province,
  type Ward,
} from "@/lib/utils/administrative-units";

// ============================================================
// TYPES
// ============================================================

export type ContractTenantRole = "REPRESENTATIVE" | "MEMBER";

export type TenantFormData = {
  id: string;
  profile_id: string | null;

  full_name: string;
  email: string;
  phone: string;
  identity_number: string;
  date_of_birth: string;

  province_code: string;
  ward_code: string;
  address_detail: string;

  role: ContractTenantRole;
};

export type TenantFormField = Exclude<
  keyof TenantFormData,
  "id" | "role"
>;

type ExistingProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  identity_number: string | null;
  date_of_birth: string | null;
  province_code: string | null;
  ward_code: string | null;
  address_detail: string | null;
  avatar_url: string | null;
  users?: {
    email: string;
  } | null;
};
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type TenantChangeHandler = (
  id: string,
  field: TenantFormField,
  value: string | null,
) => void;

type StepTenantsProps = {
  tenants: TenantFormData[];
  onAddTenant: () => void;
  onRemoveTenant: (id: string) => void;
  onTenantChange: TenantChangeHandler;
  onSetRepresentative: (id: string) => void;
};

// ============================================================
// HELPERS
// ============================================================

function createDateInputValue(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 10);
}

// ============================================================
// LOCATION COMBOBOX
// ============================================================

type LocationOption = {
  code: string;
  name: string;
};

type LocationComboboxProps = {
  value: string;
  options: LocationOption[];
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (code: string) => void;
};

function LocationCombobox({
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  loading = false,
  onSelect,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.code === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {loading
                ? "Đang tải dữ liệu..."
                : selectedOption?.name || placeholder}
            </span>

            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        }
      />

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList>
            <CommandEmpty>Không tìm thấy dữ liệu.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.code}
                  value={`${option.name} ${option.code}`}
                  onSelect={() => {
                    onSelect(option.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === option.code
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// TENANT CARD
// ============================================================

type TenantCardProps = {
  tenant: TenantFormData;
  index: number;
  totalTenants: number;

  provinces: Province[];
  provincesLoading: boolean;

  onRemoveTenant: (id: string) => void;
  onTenantChange: TenantChangeHandler;
  onSetRepresentative: (id: string) => void;
};

function TenantCard({
  tenant,
  index,
  totalTenants,
  provinces,
  provincesLoading,
  onRemoveTenant,
  onTenantChange,
  onSetRepresentative,
}: TenantCardProps) {
  // ----------------------------------------------------------
  // PROFILE SEARCH STATE
  // ----------------------------------------------------------

  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<
    ExistingProfile[]
  >([]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(
    null,
  );
  const [searchOpen, setSearchOpen] = useState(false);

  // ----------------------------------------------------------
  // WARD STATE
  // ----------------------------------------------------------

  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState<string | null>(
    null,
  );

  const isExistingProfile = Boolean(tenant.profile_id);

  // ----------------------------------------------------------
  // SEARCH PROFILE
  // ----------------------------------------------------------

  useEffect(() => {
    const searchKeyword = keyword.trim();

    if (searchKeyword.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);

        const params = new URLSearchParams({
          keyword: searchKeyword,
          page: "1",
          limit: "10",
        });

        // Frontend chỉ gọi API, không sử dụng Prisma.
        const response = await fetch(
          `/api/landlord/profiles?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Không thể tìm kiếm người thuê");
        }

        const result: ApiResponse<
          PaginationResult<ExistingProfile>
        > = await response.json();

        if (!result.success || !result.data) {
          throw new Error(
            result.message || "Tìm kiếm người thuê thất bại",
          );
        }

        setSearchResults(result.data.data ?? []);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Lỗi tìm kiếm profile:", error);

        setSearchError(
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi tìm kiếm",
        );

        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [keyword]);

  // ----------------------------------------------------------
  // LOAD WARDS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!tenant.province_code) {
      setWards([]);
      setWardsError(null);
      return;
    }

    let cancelled = false;

    const loadWards = async () => {
      try {
        setWardsLoading(true);
        setWardsError(null);

        const result = await getWards(
          Number(tenant.province_code),
        );

        if (!cancelled) {
          setWards(result);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách phường/xã:", error);

        if (!cancelled) {
          setWards([]);
          setWardsError(
            "Không thể tải danh sách phường/xã",
          );
        }
      } finally {
        if (!cancelled) {
          setWardsLoading(false);
        }
      }
    };

    void loadWards();

    return () => {
      cancelled = true;
    };
  }, [tenant.province_code]);

  // ----------------------------------------------------------
  // SELECT EXISTING PROFILE
  // ----------------------------------------------------------

  const handleSelectProfile = (profile: ExistingProfile) => {
    onTenantChange(tenant.id, "profile_id", profile.id);

    onTenantChange(
      tenant.id,
      "full_name",
      profile.full_name ?? "",
    );

    onTenantChange(
      tenant.id,
      "email",
      profile.users?.email ?? "",
    );

    onTenantChange(
      tenant.id,
      "phone",
      profile.phone ?? "",
    );

    onTenantChange(
      tenant.id,
      "identity_number",
      profile.identity_number ?? "",
    );

    onTenantChange(
      tenant.id,
      "date_of_birth",
      createDateInputValue(profile.date_of_birth),
    );

    onTenantChange(
      tenant.id,
      "province_code",
      profile.province_code ?? "",
    );

    onTenantChange(
      tenant.id,
      "ward_code",
      profile.ward_code ?? "",
    );

    onTenantChange(
      tenant.id,
      "address_detail",
      profile.address_detail ?? "",
    );

    setKeyword("");
    setSearchResults([]);
    setSearchError(null);
    setSearchOpen(false);
  };

  // ----------------------------------------------------------
  // CREATE NEW PROFILE
  // ----------------------------------------------------------

const handleCreateNewProfile = () => {
  onTenantChange(tenant.id, "profile_id", null);

  onTenantChange(tenant.id, "full_name", "");
  onTenantChange(tenant.id, "email", "");
  onTenantChange(tenant.id, "phone", "");
  onTenantChange(tenant.id, "identity_number", "");
  onTenantChange(tenant.id, "date_of_birth", "");
  onTenantChange(tenant.id, "province_code", "");
  onTenantChange(tenant.id, "ward_code", "");
  onTenantChange(tenant.id, "address_detail", "");

  setKeyword("");
  setSearchResults([]);
  setSearchError(null);
  setSearchOpen(false);
};

  // ----------------------------------------------------------
  // LOCATION OPTIONS
  // ----------------------------------------------------------

  const provinceOptions: LocationOption[] = provinces.map(
    (province) => ({
      code: String(province.code),
      name: province.name,
    }),
  );

  const wardOptions: LocationOption[] = wards.map((ward) => ({
    code: String(ward.code),
    name: ward.name,
  }));

  const selectedProvince = provinceOptions.find(
    (province) => province.code === tenant.province_code,
  );

  const selectedWard = wardOptions.find(
    (ward) => ward.code === tenant.ward_code,
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold">
                Người thuê {index + 1}
              </p>

              <p className="text-xs text-muted-foreground">
                {tenant.role === "REPRESENTATIVE"
                  ? "Người đại diện hợp đồng"
                  : "Thành viên"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tenant.role === "REPRESENTATIVE" && (
              <Badge>Đại diện</Badge>
            )}

            {totalTenants > 1 && (
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
        {/* ROLE */}

        <div className="space-y-2">
          <Label>Vai trò trong hợp đồng</Label>

          <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {tenant.role === "REPRESENTATIVE"
                  ? "Người đại diện"
                  : "Thành viên"}
              </p>

              <p className="text-xs text-muted-foreground">
                {tenant.role === "REPRESENTATIVE"
                  ? "Người đại diện cho nhóm thuê."
                  : "Người cùng thuê phòng."}
              </p>
            </div>

            {tenant.role === "MEMBER" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSetRepresentative(tenant.id)}
              >
                Chọn làm đại diện
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* SEARCH EXISTING PROFILE */}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Tìm người thuê trong hệ thống</Label>

            {isExistingProfile && (
              <Badge variant="secondary">
                <Check className="mr-1 h-3 w-3" />
                Hồ sơ có sẵn
              </Badge>
            )}
          </div>

          <Popover
            open={searchOpen}
            onOpenChange={(open) => {
              setSearchOpen(open);

              if (open && isExistingProfile) {
                setKeyword("");
              }
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-start font-normal"
                >
                  <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />

                  <span
                    className={`truncate ${
                      isExistingProfile
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isExistingProfile
                      ? `${tenant.full_name} - ${tenant.phone}`
                      : "Tìm theo tên, số điện thoại, CCCD..."}
                  </span>

                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              }
            />

            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] min-w-[400px] max-w-[calc(100vw-2rem)] p-0"
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Nhập tên, số điện thoại hoặc CCCD..."
                  value={keyword}
                  onValueChange={setKeyword}
                  className="h-12 text-base"
                />

                <CommandList>
                  {searchLoading && (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tìm kiếm...
                    </div>
                  )}

                  {!searchLoading &&
                    keyword.trim().length < 2 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nhập ít nhất 2 ký tự để tìm kiếm.
                      </div>
                    )}

                  {!searchLoading &&
                    keyword.trim().length >= 2 &&
                    searchResults.length === 0 &&
                    !searchError && (
                      <CommandEmpty>
                        Không tìm thấy người thuê.
                      </CommandEmpty>
                    )}

                  {searchError && (
                    <div className="p-4 text-sm text-destructive">
                      {searchError}
                    </div>
                  )}

                  {!searchLoading &&
                    searchResults.length > 0 && (
                      <CommandGroup heading="Hồ sơ đã tồn tại">
                        {searchResults.map((profile) => (
                          <CommandItem
                            key={profile.id}
                            value={profile.id}
                            onSelect={() =>
                              handleSelectProfile(profile)
                            }
                            className="flex flex-col items-start gap-1 py-3"
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="font-medium">
                                {profile.full_name}
                              </span>

                              {tenant.profile_id === profile.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>

                            <span className="text-xs text-muted-foreground">
                              SĐT: {profile.phone}
                            </span>

                            {profile.identity_number && (
                              <span className="text-xs text-muted-foreground">
                                CCCD: {profile.identity_number}
                              </span>
                            )}

                            {profile.users?.email && (
                              <span className="text-xs text-muted-foreground">
                                Email: {profile.users.email}
                              </span>
                            )}

                            {profile.users?.email && (
                              <span className="text-xs text-muted-foreground">
                                Email: {profile.users.email}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {isExistingProfile ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="font-medium">
                    Đang sử dụng hồ sơ có sẵn
                  </p>

                  <p className="text-xs">
                    Hệ thống sẽ liên kết profile hiện tại khi tạo
                    hợp đồng.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-green-800"
                onClick={handleCreateNewProfile}
              >
                <X className="mr-1 h-3 w-3" />
                Bỏ chọn
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <UserPlus className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                Nếu không tìm thấy người thuê trong hệ thống,
                hãy nhập thông tin bên dưới để tạo hồ sơ mới.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* PERSONAL INFORMATION */}

        <div className="space-y-4">
          <div>
            <p className="font-semibold">Thông tin cá nhân</p>

            <p className="text-xs text-muted-foreground">
              {isExistingProfile
                ? "Thông tin được lấy từ hồ sơ đã tồn tại."
                : "Nhập thông tin người thuê mới."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* FULL NAME */}

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Họ và tên <span className="text-red-500">*</span>
              </Label>

              <Input
                placeholder="Nhập họ và tên"
                value={tenant.full_name}
                disabled={isExistingProfile}
                onChange={(e) =>
                  onTenantChange(
                    tenant.id,
                    "full_name",
                    e.target.value,
                  )
                }
              />

              
            </div>

            {/* EMAIL */}

            <div className="space-y-2">
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>

              <Input
                type="email"
                placeholder="example@gmail.com"
                value={tenant.email}
                disabled={isExistingProfile}
                onChange={(e) =>
                  onTenantChange(
                    tenant.id,
                    "email",
                    e.target.value,
                  )
                }
              />

              {!isExistingProfile && (
                <p className="text-xs text-muted-foreground">
                  Email này sẽ được sử dụng để tạo tài khoản người thuê.
                </p>
              )}
            </div>

            {/* PHONE */}

            <div className="space-y-2">
              <Label>
                Số điện thoại{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                type="tel"
                placeholder="Ví dụ: 0912345678"
                value={tenant.phone}
                disabled={isExistingProfile}
                onChange={(e) =>
                  onTenantChange(
                    tenant.id,
                    "phone",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* IDENTITY NUMBER */}

            <div className="space-y-2">
              <Label>Số CCCD</Label>

              <Input
                placeholder="Nhập số CCCD"
                value={tenant.identity_number}
                disabled={isExistingProfile}
                onChange={(e) =>
                  onTenantChange(
                    tenant.id,
                    "identity_number",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* DATE OF BIRTH */}

            <div className="space-y-2">
              <Label>Ngày sinh</Label>

              <Input
                type="date"
                value={tenant.date_of_birth}
                disabled={isExistingProfile}
                onChange={(e) =>
                  onTenantChange(
                    tenant.id,
                    "date_of_birth",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* PROVINCE */}

            <div className="space-y-2">
              <Label>Tỉnh / Thành phố</Label>

              <LocationCombobox
                value={tenant.province_code}
                options={provinceOptions}
                placeholder="Chọn tỉnh / thành phố"
                searchPlaceholder="Tìm tỉnh / thành phố..."
                loading={provincesLoading}
                disabled={
                  isExistingProfile || provincesLoading
                }
                onSelect={(code) => {
                  onTenantChange(
                    tenant.id,
                    "province_code",
                    code,
                  );

                  onTenantChange(
                    tenant.id,
                    "ward_code",
                    "",
                  );
                }}
              />
            </div>

            {/* WARD */}

            <div className="space-y-2">
              <Label>Phường / Xã</Label>

              <LocationCombobox
                value={tenant.ward_code}
                options={wardOptions}
                placeholder={
                  tenant.province_code
                    ? "Chọn phường / xã"
                    : "Chọn tỉnh trước"
                }
                searchPlaceholder="Tìm phường / xã..."
                disabled={
                  isExistingProfile ||
                  !tenant.province_code ||
                  wardsLoading
                }
                loading={wardsLoading}
                onSelect={(code) =>
                  onTenantChange(
                    tenant.id,
                    "ward_code",
                    code,
                  )
                }
              />

              {wardsError && (
                <p className="text-xs text-destructive">
                  {wardsError}
                </p>
              )}

              {tenant.ward_code && selectedWard && (
                <p className="text-xs text-muted-foreground">
                  {selectedProvince?.name} / {selectedWard.name}
                </p>
              )}

              {tenant.ward_code &&
                !wardsLoading &&
                wards.length > 0 &&
                !selectedWard && (
                  <p className="text-xs text-amber-600">
                    Không tìm thấy tên phường/xã tương ứng với
                    mã đã lưu.
                  </p>
                )}
            </div>

            {/* ADDRESS DETAIL */}

            <div className="space-y-2 sm:col-span-2">
              <Label>Địa chỉ chi tiết</Label>

              <Input
                placeholder="Số nhà, tên đường..."
                value={tenant.address_detail}
                disabled={isExistingProfile}
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
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function StepTenants({
  tenants,
  onAddTenant,
  onRemoveTenant,
  onTenantChange,
  onSetRepresentative,
}: StepTenantsProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [provincesError, setProvincesError] = useState<
    string | null
  >(null);

  // ----------------------------------------------------------
  // LOAD PROVINCES
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadProvinces = async () => {
      try {
        setProvincesLoading(true);
        setProvincesError(null);

        const result = await getProvinces();

        if (!cancelled) {
          setProvinces(result);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh/thành phố:", error);

        if (!cancelled) {
          setProvincesError(
            "Không thể tải danh sách tỉnh/thành phố.",
          );
        }
      } finally {
        if (!cancelled) {
          setProvincesLoading(false);
        }
      }
    };

    void loadProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

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
              Tìm người thuê đã có trong hệ thống hoặc thêm
              người thuê mới vào hợp đồng.
            </p>
          </div>

          <Badge variant="secondary">
            {tenants.length} người thuê
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* INFORMATION */}

        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />

          <p>
            Mỗi hợp đồng cần một người đại diện. Bạn có thể tìm
            kiếm người thuê đã tồn tại để sử dụng lại hồ sơ,
            tránh tạo dữ liệu trùng lặp.
          </p>
        </div>

        {/* PROVINCE ERROR */}

        {provincesError && (
          <p className="text-sm text-destructive">
            {provincesError}
          </p>
        )}

        {/* TENANT LIST */}

        {tenants.map((tenant, index) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            index={index}
            totalTenants={tenants.length}
            provinces={provinces}
            provincesLoading={provincesLoading}
            onRemoveTenant={onRemoveTenant}
            onTenantChange={onTenantChange}
            onSetRepresentative={onSetRepresentative}
          />
        ))}

        {/* ADD TENANT */}

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
          Thông tin cá nhân tương ứng với model profiles. Vai trò
          tương ứng với contract_tenants.role.
        </p>
      </CardContent>
    </Card>
  );
}
