"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProfileWithUser } from "@/lib/api/repositories/profiles/profiles.repository";



type ProfilesResponse = {
  success: boolean;
  message?: string;
  data?: {
    data: ProfileWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

const PAGE_SIZE = 10;

function getAccountStatus(status: string | undefined) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Đã kích hoạt",
        className: "border-green-200 bg-green-50 text-green-700",
      };

    case "INACTIVE":
      return {
        label: "Chưa kích hoạt",
        className: "border-yellow-200 bg-yellow-50 text-yellow-700",
      };

    case "LOCKED":
      return {
        label: "Đã khóa",
        className: "border-red-200 bg-red-50 text-red-700",
      };

    default:
      return {
        label: "Không xác định",
        className: "border-gray-200 bg-gray-50 text-gray-600",
      };
  }
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileWithUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Đợi người dùng ngừng nhập 300ms mới tìm kiếm.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Lấy danh sách người thuê từ API.
  const fetchProfiles = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (debouncedKeyword) {
          params.set("keyword", debouncedKeyword);
        }

        const response = await fetch(
          `/api/landlord/profiles?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const result: ProfilesResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Không thể lấy danh sách người thuê.",
          );
        }

        setProfiles(result.data.data);
        setTotal(result.data.total);
        setTotalPage(Math.max(1, result.data.totalPage));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Lỗi lấy danh sách người thuê:", err);

        setProfiles([]);
        setTotal(0);
        setTotalPage(1);

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi lấy danh sách người thuê.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, debouncedKeyword],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchProfiles(controller.signal);

    return () => controller.abort();
  }, [fetchProfiles]);

  const handleClearSearch = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setPage(1);
  };

  const getPageNumbers = () => {
    const start = Math.max(1, Math.min(page - 2, totalPage - 4));
    const end = Math.min(totalPage, start + 4);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index,
    );
  };

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-5">
      {/* Tiêu đề */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Quản lý người thuê
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách người thuê và trạng thái tài khoản.
          </p>
        </div>

        <Badge variant="secondary" className="w-fit px-3 py-1">
          <Users className="mr-2 size-4" />
          {total} người thuê
        </Badge>
      </div>

      {/* Tìm kiếm tự động */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo họ tên, số điện thoại, CCCD hoặc email..."
          className="h-11 bg-white pl-9 pr-10"
        />

        {keyword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xóa nội dung tìm kiếm"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
            onClick={handleClearSearch}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Danh sách */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <CardTitle className="text-base">
            Danh sách người thuê
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              Đang tải danh sách người thuê...
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
              <AlertCircle className="size-8 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setPage((current) => current);
                  setDebouncedKeyword((current) => `${current} `);
                }}
              >
                Thử tìm lại
              </Button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-4 text-center">
              <Users className="size-10 text-gray-300" />
              <p className="font-medium text-gray-700">
                Không tìm thấy người thuê
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedKeyword
                  ? "Thử tìm với họ tên, số điện thoại hoặc email khác."
                  : "Danh sách người thuê hiện chưa có dữ liệu."}
              </p>
            </div>
          ) : (
            <>
              {/* Bảng trên màn hình vừa và lớn */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-gray-600">
                      <th className="px-6 py-3 font-medium">Người thuê</th>
                      <th className="px-4 py-3 font-medium">Số điện thoại</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">CCCD</th>
                      <th className="px-6 py-3 font-medium">
                        Trạng thái tài khoản
                      </th>
                      <th className="px-6 py-3 font-medium">
                        Hành động
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {profiles.map((profile) => {
                      const accountStatus = getAccountStatus(
                        profile.users?.status,
                      );

                      return (
                        <tr
                          key={String(profile.id)}
                          className="border-b last:border-b-0 hover:bg-gray-50/70"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                                <UserRound className="size-5 text-blue-600" />
                              </div>

                              <div className="font-medium text-gray-900">
                                {profile.full_name || "Chưa cập nhật"}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {profile.phone || "—"}
                          </td>

                          <td className="px-4 py-4">
                            {profile.users?.email || "—"}
                          </td>

                          <td className="px-4 py-4">
                            {profile.identity_number || "—"}
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={accountStatus.className}
                            >
                              {accountStatus.label}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">
                            <Link href={`/landlord/profiles/${profile.id}`} className="text-blue-600 hover:underline decoration-blue-600">
                                Chi tiết
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Thẻ trên màn hình nhỏ */}
              <div className="grid gap-3 p-3 md:hidden">
                {profiles.map((profile) => {
                  const accountStatus = getAccountStatus(
                    profile.users?.status,
                  );

                  return (
                    <div
                      key={String(profile.id)}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <UserRound className="size-5 text-blue-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-gray-900">
                            {profile.full_name || "Chưa cập nhật"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-2 ${accountStatus.className}`}
                          >
                            {accountStatus.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p className="flex items-start gap-2">
                          <Phone className="mt-0.5 size-4 shrink-0" />
                          <span>{profile.phone || "Chưa có số điện thoại"}</span>
                        </p>

                        <p className="flex items-start gap-2">
                          <Mail className="mt-0.5 size-4 shrink-0" />
                          <span className="break-all">
                            {profile.users?.email || "Chưa có email"}
                          </span>
                        </p>

                        <p>
                          CCCD: {profile.identity_number || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phân trang */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-4 sm:flex-row sm:px-6">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {startIndex}–{endIndex} trong {total} người thuê
                </p>

                {totalPage > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={
                            page <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers().map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === page}
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
                            if (page < totalPage) setPage(page + 1);
                          }}
                          className={
                            page >= totalPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}