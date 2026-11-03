
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type FormAddTenantProps = {
  contractId: string;
  onSuccess: () => void | Promise<void>;
  currentOccupants: number;
  maxOccupants: number;
};

type TenantFormData = {
  full_name: string;
  email: string;
  phone: string;
  identity_number: string;
  date_of_birth: string;
  province_code: string;
  ward_code: string;
  address_detail: string;
};

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
  message?: string;
  data: T;
};

type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type LocationOption = {
  code: string;
  name: string;
};

const initialForm: TenantFormData = {
  full_name: "",
  email: "",
  phone: "",
  identity_number: "",
  date_of_birth: "",
  province_code: "",
  ward_code: "",
  address_detail: "",
};

function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

// ============================================================
// LOCATION COMBOBOX
// ============================================================

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
// MAIN DIALOG
// ============================================================

export default function FormAddTenant({
  contractId,
  onSuccess,
  currentOccupants,
  maxOccupants,
}: FormAddTenantProps) {
  const [open, setOpen] = useState(false);

  const capacityReached = currentOccupants >= maxOccupants;

  const [form, setForm] = useState<TenantFormData>(initialForm);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Search existing profiles
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Administrative units
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [provincesError, setProvincesError] = useState<string | null>(null);
  const [wardsError, setWardsError] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isExistingProfile = Boolean(profileId);

  const updateField = <K extends keyof TenantFormData>(
    field: K,
    value: TenantFormData[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setProfileId(null);

    setKeyword("");
    setSearchResults([]);
    setSearchError(null);
    setSearchOpen(false);

    setWards([]);
    setWardsError(null);
    setProvincesError(null);
    setSubmitError(null);
  };

  // ----------------------------------------------------------
  // LOAD PROVINCES
  // ----------------------------------------------------------

  useEffect(() => {
    if (!open || provinces.length > 0) return;

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
        console.error("Lỗi tải tỉnh/thành phố:", error);

        if (!cancelled) {
          setProvincesError("Không thể tải danh sách tỉnh/thành phố.");
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
  }, [open, provinces.length]);

  // ----------------------------------------------------------
  // SEARCH EXISTING PROFILES
  // ----------------------------------------------------------

  useEffect(() => {
    if (!open) return;

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

        const response = await fetch(
          `/api/landlord/profiles?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Không thể tìm kiếm hồ sơ người thuê.");
        }

        const result: ApiResponse<PaginationResult<ExistingProfile>> =
          await response.json();

        if (!result.success || !result.data) {
          throw new Error(
            result.message || "Tìm kiếm hồ sơ người thuê thất bại.",
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

        console.error("Lỗi tìm kiếm hồ sơ:", error);

        setSearchError(
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi tìm kiếm.",
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
  }, [keyword, open]);

  // ----------------------------------------------------------
  // LOAD WARDS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!open || !form.province_code) {
      setWards([]);
      setWardsError(null);
      return;
    }

    let cancelled = false;

    const loadWards = async () => {
      try {
        setWardsLoading(true);
        setWardsError(null);

        const result = await getWards(Number(form.province_code));

        if (!cancelled) {
          setWards(result);
        }
      } catch (error) {
        console.error("Lỗi tải phường/xã:", error);

        if (!cancelled) {
          setWards([]);
          setWardsError("Không thể tải danh sách phường/xã.");
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
  }, [open, form.province_code]);

  // ----------------------------------------------------------
  // SELECT EXISTING PROFILE
  // ----------------------------------------------------------

  const handleSelectProfile = (profile: ExistingProfile) => {
    setProfileId(profile.id);

    setForm({
      full_name: profile.full_name ?? "",
      email: profile.users?.email ?? "",
      phone: profile.phone ?? "",
      identity_number: profile.identity_number ?? "",
      date_of_birth: dateInputValue(profile.date_of_birth),
      province_code: profile.province_code ?? "",
      ward_code: profile.ward_code ?? "",
      address_detail: profile.address_detail ?? "",
    });

    setKeyword("");
    setSearchResults([]);
    setSearchError(null);
    setSearchOpen(false);
    setSubmitError(null);
  };

  // ----------------------------------------------------------
  // CLEAR SELECTED PROFILE AND ENTER A NEW TENANT
  // ----------------------------------------------------------

  const handleCreateNewProfile = () => {
    setProfileId(null);
    setForm(initialForm);

    setKeyword("");
    setSearchResults([]);
    setSearchError(null);
    setSearchOpen(false);
    setSubmitError(null);
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setSubmitError(null);

  if (!profileId) {
    if (!form.full_name.trim()) {
      setSubmitError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!form.email.trim()) {
      setSubmitError("Vui lòng nhập email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setSubmitError("Email không hợp lệ.");
      return;
    }

    if (!form.phone.trim()) {
      setSubmitError("Vui lòng nhập số điện thoại.");
      return;
    }
  }

  setSubmitting(true);

  let targetProfileId = profileId;
  let profileCreated = false;

  try {
    // BƯỚC 1: Chỉ tạo tài khoản + hồ sơ nếu chưa chọn hồ sơ có sẵn
    if (!targetProfileId) {
      const profileResponse = await fetch("/api/landlord/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            email: form.email.trim().toLowerCase(),
            role: "TENANT",
            status: "INACTIVE",
          },
          profile: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            identity_number: form.identity_number.trim() || null,
            date_of_birth: form.date_of_birth || null,
            province_code: form.province_code || null,
            ward_code: form.ward_code || null,
            address_detail: form.address_detail.trim() || null,
          },
        }),
      });

      const profileResult = await profileResponse.json().catch(() => null);

      if (!profileResponse.ok || !profileResult?.success) {
        throw new Error(
          profileResult?.message || "Không thể tạo tài khoản và hồ sơ người thuê.",
        );
      }

      const newProfileId = profileResult?.data?.profile?.id;

      if (newProfileId == null) {
        throw new Error(
          "Tạo hồ sơ thành công nhưng không nhận được ID hồ sơ.",
        );
      }

      targetProfileId = String(newProfileId);
      profileCreated = true;

      // Lưu lại để nếu liên kết thất bại thì có thể thử liên kết lại,
      // không tạo thêm tài khoản/hồ sơ trùng lặp.
      setProfileId(targetProfileId);
    }

    // BƯỚC 2: Liên kết hồ sơ vào hợp đồng
    const tenantResponse = await fetch(
      `/api/landlord/rental_contracts/${contractId}/contract_tenants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: targetProfileId,
          role: "MEMBER",
        }),
      },
    );

    const tenantResult = await tenantResponse.json().catch(() => null);

    if (!tenantResponse.ok || !tenantResult?.success) {
      const message =
        tenantResult?.message || "Không thể thêm người thuê vào hợp đồng.";

      if (profileCreated) {
        throw new Error(
          `Tài khoản và hồ sơ đã được tạo, nhưng chưa liên kết vào hợp đồng. ${message} Bạn có thể thử thêm lại mà không cần tạo lại hồ sơ.`,
        );
      }

      throw new Error(message);
    }

    await onSuccess();

    resetForm();
    setOpen(false);
  } catch (error) {
    console.error("Lỗi thêm người thuê:", error);

    setSubmitError(
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi thêm người thuê.",
    );
  } finally {
    setSubmitting(false);
  }
};

  const provinceOptions: LocationOption[] = provinces.map((province) => ({
    code: String(province.code),
    name: province.name,
  }));

  const wardOptions: LocationOption[] = wards.map((ward: Ward) => ({
    code: String(ward.code),
    name: ward.name,
  }));

  const selectedProvince = provinceOptions.find(
    (province) => province.code === form.province_code,
  );

  const selectedWard = wardOptions.find(
    (ward) => ward.code === form.ward_code,
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <>
     <Button
        type="button"
        disabled={capacityReached}
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md transition-all hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {capacityReached ? (
          <>
            <Users className="mr-2 h-4 w-4" />
            Phòng đã đủ người
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Thêm người thuê
          </>
        )}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (submitting) return;

          setOpen(nextOpen);

          if (!nextOpen) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Thêm người thuê vào hợp đồng
            </DialogTitle>

            <DialogDescription>
              Tìm và chọn hồ sơ đã có hoặc nhập thông tin để tạo
              người thuê mới. Người được thêm sẽ là thành viên hợp đồng.
            </DialogDescription>
          </DialogHeader>

          <div
          className={`rounded-xl border p-4 ${
            capacityReached
              ? "border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
              : "border-violet-200 bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <Users className="h-5 w-5 text-violet-600" />
              </div>

              <div>
                <p className="font-semibold text-slate-800">
                  Sức chứa phòng
                </p>
                <p className="text-sm text-slate-500">
                  Số người thuê đang hoạt động
                </p>
              </div>
            </div>

            <p className="text-xl font-bold tabular-nums text-violet-700">
              {currentOccupants}/{maxOccupants}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full transition-all ${
                capacityReached ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-blue-500"
              }`}
              style={{
                width: `${maxOccupants > 0 ? Math.min(100, (currentOccupants / maxOccupants) * 100) : 100}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-600">
            {capacityReached
              ? "Phòng đã đạt sức chứa tối đa, không thể thêm người thuê."
              : `Còn ${maxOccupants - currentOccupants} chỗ trống.`}
          </p>
        </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="font-medium">Vai trò trong hợp đồng</p>
                <p className="text-xs text-muted-foreground">
                  Người cùng thuê phòng
                </p>
              </div>

              <Badge variant="secondary">Thành viên</Badge>
            </div>

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

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className="w-full justify-start font-normal"
                      disabled={submitting}
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
                          ? `${form.full_name} - ${form.phone}`
                          : "Tìm theo tên, số điện thoại, CCCD..."}
                      </span>

                      <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  }
                />

                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Nhập tên, số điện thoại hoặc CCCD..."
                      value={keyword}
                      onValueChange={setKeyword}
                      className="h-12"
                    />

                    <CommandList>
                      {searchLoading && (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tìm kiếm...
                        </div>
                      )}

                      {!searchLoading && keyword.trim().length < 2 && (
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

                      {!searchLoading && searchResults.length > 0 && (
                        <CommandGroup heading="Hồ sơ đã tồn tại">
                          {searchResults.map((profile) => (
                            <CommandItem
                              key={profile.id}
                              value={profile.id}
                              onSelect={() => handleSelectProfile(profile)}
                              className="flex flex-col items-start gap-1 py-3"
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="font-medium">
                                  {profile.full_name}
                                </span>

                                {profileId === profile.id && (
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
                        Hệ thống sẽ liên kết profile hiện tại khi thêm
                        người thuê vào hợp đồng.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-green-800"
                    disabled={submitting}
                    onClick={handleCreateNewProfile}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Bỏ chọn
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nếu người thuê chưa có hồ sơ, nhập thông tin bên dưới
                  để tạo hồ sơ mới.
                </p>
              )}
            </div>

            {/* PERSONAL INFORMATION */}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Thông tin cá nhân</h3>
                <p className="text-xs text-muted-foreground">
                  {isExistingProfile
                    ? "Thông tin lấy từ hồ sơ đã tồn tại."
                    : "Các trường có dấu * là bắt buộc."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="add-tenant-name">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-tenant-name"
                    value={form.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    placeholder="Nhập họ và tên"
                    disabled={isExistingProfile || submitting}
                    required={!isExistingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-tenant-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-tenant-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="example@gmail.com"
                    disabled={isExistingProfile || submitting}
                    required={!isExistingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-tenant-phone">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-tenant-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="0912345678"
                    disabled={isExistingProfile || submitting}
                    required={!isExistingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-tenant-identity">Số CCCD</Label>
                  <Input
                    id="add-tenant-identity"
                    value={form.identity_number}
                    onChange={(event) =>
                      updateField("identity_number", event.target.value)
                    }
                    placeholder="Nhập số CCCD"
                    disabled={isExistingProfile || submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-tenant-birth">Ngày sinh</Label>
                  <Input
                    id="add-tenant-birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(event) =>
                      updateField("date_of_birth", event.target.value)
                    }
                    disabled={isExistingProfile || submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tỉnh / Thành phố</Label>
                  <LocationCombobox
                    value={form.province_code}
                    options={provinceOptions}
                    placeholder="Chọn tỉnh / thành phố"
                    searchPlaceholder="Tìm tỉnh / thành phố..."
                    loading={provincesLoading}
                    disabled={
                      isExistingProfile ||
                      submitting ||
                      provincesLoading
                    }
                    onSelect={(code) => {
                      setForm((previous) => ({
                        ...previous,
                        province_code: code,
                        ward_code: "",
                      }));
                    }}
                  />
                  {provincesError && (
                    <p className="text-xs text-destructive">
                      {provincesError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phường / Xã</Label>
                  <LocationCombobox
                    value={form.ward_code}
                    options={wardOptions}
                    placeholder={
                      form.province_code
                        ? "Chọn phường / xã"
                        : "Chọn tỉnh/thành phố trước"
                    }
                    searchPlaceholder="Tìm phường / xã..."
                    loading={wardsLoading}
                    disabled={
                      isExistingProfile ||
                      submitting ||
                      !form.province_code ||
                      wardsLoading
                    }
                    onSelect={(code) => updateField("ward_code", code)}
                  />
                  {wardsError && (
                    <p className="text-xs text-destructive">
                      {wardsError}
                    </p>
                  )}
                  {form.ward_code && selectedWard && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProvince?.name} / {selectedWard.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="add-tenant-address">
                    Địa chỉ chi tiết
                  </Label>
                  <Input
                    id="add-tenant-address"
                    value={form.address_detail}
                    onChange={(event) =>
                      updateField("address_detail", event.target.value)
                    }
                    placeholder="Số nhà, tên đường..."
                    disabled={isExistingProfile || submitting}
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm vào hợp đồng
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
