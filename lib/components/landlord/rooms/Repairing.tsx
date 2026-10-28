"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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

import { DoorOpen, Loader2, Maximize, Users, Wallet } from "lucide-react";

import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";

const PAGE_SIZE = 10;

type RepairingProps = {
  rooms: RoomWithCurrentContract[];
  loading: boolean;
  error: string | null;
};

export default function Repairing({ rooms, loading, error }: RepairingProps) {
  const [page, setPage] = useState(1);

  const repairingRooms = rooms.filter(
    // Phòng đang cho thuê
    (room) => room.status === "MAINTENANCE",
  );

  // Tổng số trang
  const total = repairingRooms.length;
  const totalPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Nếu danh sách thay đổi và số trang giảm,
  // tự động đưa trang hiện tại về trang hợp lệ.
  const currentPage = Math.min(page, totalPage);

  // Chỉ lấy các phòng thuộc trang hiện tại
  const currentRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return repairingRooms.slice(startIndex, startIndex + PAGE_SIZE);
  }, [repairingRooms, currentPage]);

  // Khoảng dữ liệu đang hiển thị
  const startIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, total);

  // Danh sách số trang
  const getPageNumbers = () => {
    const pages: number[] = [];

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPage, currentPage + 2);

    if (currentPage <= 2) {
      end = Math.min(totalPage, 5);
    }

    if (currentPage >= totalPage - 1) {
      start = Math.max(1, totalPage - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-xl font-bold text-violet-800">
          Phòng đang sửa chữa
        </h2>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải danh sách phòng...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Nội dung */}
      {!loading && !error && (
        <>
          {repairingRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <DoorOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />

              <p className="font-medium text-gray-700">Chưa có phòng nào</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Danh sách phòng hiện đang trống.
              </p>
            </div>
          ) : (
            <>
              {/* Danh sách card */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {currentRooms.map((room) => {
                  const isRenting = room.current_contract !== null;

                  const occupantCount =
                    room.current_contract?.contract_tenants.length ?? 0;

                  const isMaintenance = room.status === "MAINTENANCE";

                  return (
                    <Card
                      key={String(room.id)}
                      className="gap-3 overflow-hidden rounded-xl border-gray-200 py-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardHeader className="px-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                            <DoorOpen className="h-5 w-5 text-blue-600" />
                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                              isMaintenance
                                ? "bg-violet-50 text-violet-700"
                                : isRenting
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isMaintenance
                              ? "Đang sửa chữa"
                              : isRenting
                                ? "Đang cho thuê"
                                : "Phòng trống"}
                          </span>
                        </div>

                        <CardTitle className="mt-1 text-base font-bold">
                          Phòng {room.room_number}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 px-3">
                        {/* Đơn giá */}
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 shrink-0 text-orange-500" />

                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground">
                              Đơn giá
                            </p>

                            <p className="truncate text-sm font-semibold text-gray-800">
                              {Number(room.listed_rent).toLocaleString("vi-VN")}
                              đ
                              <span className="text-[10px] font-normal text-muted-foreground">
                                /tháng
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Diện tích */}
                        <div className="flex items-center gap-2">
                          <Maximize className="h-4 w-4 shrink-0 text-blue-500" />

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Diện tích
                            </p>

                            <p className="text-sm font-medium">
                              {Number(room.area)} m²
                            </p>
                          </div>
                        </div>

                        {/* Số người */}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 shrink-0 text-violet-500" />

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Số người
                            </p>

                            <p className="text-sm font-medium">
                              {occupantCount}/{room.max_occupants} người
                            </p>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Link href={`/landlord/rooms/${room.id}`}>
                            Chi tiết
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              {/* Phân trang */}
              {totalPage > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị {startIndex}–{endIndex} trong {total} phòng
                  </p>

                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();

                            if (currentPage > 1) {
                              setPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers().map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
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

                            if (currentPage < totalPage) {
                              setPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage === totalPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
