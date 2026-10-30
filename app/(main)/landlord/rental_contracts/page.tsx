"use client";

import { Button } from "@/components/ui/button";
import { RentalContractWithDetails } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";
import { ContractFilters } from "@/lib/components/landlord/rental_contracts/ContractFilters";
import { ContractList } from "@/lib/components/landlord/rental_contracts/ContractList";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function RentalContractPage() {
  const [contracts, setContracts] = useState<RentalContractWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState("");

  const [total, setTotal] = useState(0);
  const [totalPage, setTotalPage] = useState(1);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      const response = await fetch(
        `/api/landlord/rental_contracts?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lấy danh sách hợp đồng");
      }

      const contractData = result.data?.data;

      if (!Array.isArray(contractData)) {
        throw new Error("Dữ liệu danh sách hợp đồng không hợp lệ");
      }

      setContracts(contractData);
      setTotal(result.data.total ?? 0);
      setTotalPage(result.data.totalPage ?? 1);
    } catch (error) {
      console.error("Lỗi lấy danh sách hợp đồng:", error);

      setContracts([]);
      setTotal(0);
      setTotalPage(1);

      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi lấy danh sách hợp đồng",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword]);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  return (
    <div className="flex flex-col gap-y-4 p-3 sm:p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-black md:text-xl">
          Trang quản lý hợp đồng
        </h1>
        <Link href="/landlord/rental_contracts/create">
          <Button className="bg-blue-600 font-bold text-white hover:bg-blue-500">
            + Tạo hợp đồng
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-y-3">
        <ContractFilters />

        <ContractList contracts={contracts} loading={loading} error={error} />
      </div>
    </div>
  );
}
