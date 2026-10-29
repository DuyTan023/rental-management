"use client";

import { Button } from "@/components/ui/button";
import { ContractFilters } from "@/lib/components/landlord/rental_contracts/ContractFilters";
import { ContractList } from "@/lib/components/landlord/rental_contracts/ContractList";

export default function RentalContractPage() {
  return (
    <div className="flex flex-col gap-y-4 p-3 sm:p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-black md:text-xl">
          Trang quản lý hợp đồng
        </h1>

        <Button className="bg-blue-600 font-bold text-white hover:bg-blue-500">
          + Tạo hợp đồng
        </Button>
      </div>

      <div className="flex flex-col gap-y-3">
        <ContractFilters />

        <ContractList />
      </div>
    </div>
  );
}
