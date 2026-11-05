
// "use client";

// import { useCallback, useEffect, useState } from "react";
// import {
//   Droplets,
//   Gauge,
//   Loader2,
//   Pencil,
//   Save,
//   Zap,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// type MeterType = "ELECTRICITY" | "WATER";

// type MeterReading = {
//   id: string;
//   meter_type: MeterType;
//   old_value: number | string;
//   new_value: number | string;
//   reading_date: string;
//   service_id?: string;
//   note?: string | null;
// };

// type Service = {
//   id: string;
//   name: string;
//   type: string;
//   is_active: boolean;
// };

// type Props = {
//   contractId: string;
//   roomId: string;
//   contractStatus: string;
//   contractStartDate: string | Date;
// };

// function getDateInputValue(value: string | Date): string {
//   if (typeof value === "string") {
//     const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

//     if (dateOnly) return dateOnly;
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return new Date().toLocaleDateString("en-CA", {
//       timeZone: "Asia/Ho_Chi_Minh",
//     });
//   }

//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// function formatReading(value: number | string | undefined) {
//   if (value === undefined || value === null || value === "") {
//     return "Chưa nhập";
//   }

//   const number = Number(value);

//   if (!Number.isFinite(number)) return String(value);

//   return new Intl.NumberFormat("vi-VN", {
//     maximumFractionDigits: 3,
//   }).format(number);
// }

// function normalizeName(value: string) {
//   return value
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/đ/g, "d")
//     .replace(/Đ/g, "D")
//     .toLowerCase()
//     .trim();
// }

// export default function ContractMeterReadings({
//   contractId,
//   roomId,
//   contractStatus,
//   contractStartDate,
// }: Props) {
//   const [readings, setReadings] = useState<MeterReading[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [dialogOpen, setDialogOpen] = useState(false);

//   const [electricityValue, setElectricityValue] = useState("");
//   const [note, setNote] = useState("");
//   const [waterValue, setWaterValue] = useState("");
//   const [readingDate, setReadingDate] = useState(
//     getDateInputValue(contractStartDate),
//   );

//   const canEdit = contractStatus === "ACTIVE";

//   const electricityReading = readings.find(
//     (item) => item.meter_type === "ELECTRICITY",
//   );

//   const waterReading = readings.find(
//     (item) => item.meter_type === "WATER",
//   );

//   const fetchData = useCallback(async () => {
//   try {
//     setLoading(true);
//     setError(null);

//     const [readingResponse, serviceResponse] = await Promise.all([
//       fetch(
//         `/api/landlord/meter_readings?room_id=${roomId}&contract_id=${contractId}&page=1&limit=100`,
//         { cache: "no-store" },
//       ),
//       fetch("/api/landlord/services", { cache: "no-store" }),
//     ]);

//     const [readingResult, serviceResult] = await Promise.all([
//       readingResponse.json(),
//       serviceResponse.json(),
//     ]);

//     console.log("Reading API:", readingResult);
//     console.log("Service API:", serviceResult);

//     if (!readingResponse.ok || !readingResult.success) {
//       throw new Error(
//         readingResult.message || "Không thể lấy chỉ số điện nước.",
//       );
//     }

//     if (!serviceResponse.ok || !serviceResult.success) {
//       throw new Error(
//         serviceResult.message || "Không thể lấy danh sách dịch vụ.",
//       );
//     }

//     const readingData =
//       readingResult.data?.data ?? readingResult.data;

//     const serviceData =
//       serviceResult.data?.data ?? serviceResult.data;

//     console.log("Service data is array:", Array.isArray(serviceData));
//     console.table(
//       (Array.isArray(serviceData) ? serviceData : []).map(
//         (service: Service) => ({
//           id: service.id,
//           name: service.name,
//           normalizedName: normalizeName(service.name),
//           type: service.type,
//           is_active: service.is_active,
//         }),
//       ),
//     );

//     setReadings(Array.isArray(readingData) ? readingData : []);
//     setServices(Array.isArray(serviceData) ? serviceData : []);
//   } catch (err) {
//     setError(
//       err instanceof Error
//         ? err.message
//         : "Đã xảy ra lỗi khi tải chỉ số điện nước.",
//     );
//   } finally {
//     setLoading(false);
//   }
// }, [contractId, roomId]);

//   useEffect(() => {
//     void fetchData();
//   }, [fetchData]);

//   const openEditor = () => {
//     setElectricityValue(
//       electricityReading
//         ? String(electricityReading.new_value)
//         : "",
//     );
//     setNote(
//     electricityReading?.note ??
//         waterReading?.note ??
//         "",
//     );

//     setWaterValue(
//       waterReading ? String(waterReading.new_value) : "",
//     );

//     setReadingDate(
//       getDateInputValue(
//         electricityReading?.reading_date ??
//           waterReading?.reading_date ??
//           contractStartDate,
//       ),
//     );

//     setError(null);
//     setDialogOpen(true);
//   };

//   const findMeterService = (meterType: MeterType) => {
//     const keywords =
//       meterType === "ELECTRICITY"
//         ? ["dien", "electricity", "electric"]
//         : ["nuoc", "water"];

//     return services.find((service) => {
//       if (!service.is_active || service.type !== "METERED") {
//         return false;
//       }

//       const name = normalizeName(service.name);

//       return keywords.some((keyword) => name.includes(keyword));
//     });
//   };

//   const saveReading = async (
//     meterType: MeterType,
//     value: string,
//     service: Service,
//     note: string,
//   ) => {
//     const existing =
//       meterType === "ELECTRICITY"
//         ? electricityReading
//         : waterReading;

//     const payload = {
//       meter_type: meterType,
//       reading_date: new Date(
//         `${readingDate}T00:00:00+07:00`,
//       ).toISOString(),
//       old_value: value,
//       new_value: value,
//       note: note.trim() || null,
//     };

//     const response = await fetch(
//       existing
//         ? `/api/landlord/meter_readings/${existing.id}`
//         : "/api/landlord/meter_readings",
//       {
//         method: existing ? "PUT" : "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(
//           existing
//             ? payload
//             : {
//                 ...payload,
//                 rooms: {
//                   connect: { id: roomId },
//                 },
//                 rental_contracts: {
//                   connect: { id: contractId },
//                 },
//                 services: {
//                   connect: { id: service.id },
//                 },
//               },
//         ),
//       },
//     );

//     const result = await response.json();

//     if (!response.ok || !result.success) {
//       throw new Error(
//         result.message ||
//           `Không thể lưu chỉ số ${
//             meterType === "ELECTRICITY" ? "điện" : "nước"
//           }.`,
//       );
//     }
//   };

//   const handleSave = async () => {
//     if (!canEdit) return;

//     setError(null);

//     if (!readingDate) {
//       setError("Vui lòng chọn ngày bàn giao.");
//       return;
//     }

//     const values = [
//       { type: "ELECTRICITY" as const, value: electricityValue },
//       { type: "WATER" as const, value: waterValue },
//     ];

//     for (const item of values) {
//       if (
//         item.value.trim() === "" ||
//         !Number.isFinite(Number(item.value)) ||
//         Number(item.value) < 0
//       ) {
//         setError("Vui lòng nhập chỉ số điện và nước hợp lệ.");
//         return;
//       }
//     }

//     const electricityService = findMeterService("ELECTRICITY");
//     const waterService = findMeterService("WATER");

//     if (!electricityService || !waterService) {
//       setError(
//         "Không tìm thấy dịch vụ điện hoặc nước đang hoạt động có loại METERED. Vui lòng kiểm tra danh mục dịch vụ.",
//       );
//       return;
//     }

//     try {
//       setSaving(true);

//       await saveReading(
//         "ELECTRICITY",
//         electricityValue,
//         electricityService,
//         note,
//       );

//       await saveReading("WATER", waterValue, waterService, note);

//       await fetchData();
//       setDialogOpen(false);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Không thể lưu chỉ số bàn giao.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <Card>
//         <CardContent className="space-y-3 p-5">
//           <div className="flex items-center gap-3">
//             <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
//               <Gauge className="h-6 w-6" />
//             </div>

//             <div className="min-w-0">
//               <p className="text-sm text-muted-foreground">
//                 Chỉ số bàn giao
//               </p>

//               <p className="mt-1 text-sm font-semibold">
//                 {loading
//                   ? "Đang tải..."
//                   : electricityReading && waterReading
//                     ? "Đã nhập đủ"
//                     : "Chưa nhập đủ"}
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="min-w-0 rounded-lg border p-3">
//               <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
//                 <Zap className="h-4 w-4 text-amber-500" />
//                 Điện
//               </div>

//               <p className="mt-2 break-words text-lg font-bold">
//                 {loading
//                   ? "..."
//                   : electricityReading
//                     ? formatReading(electricityReading.new_value)
//                     : "Chưa nhập"}
//               </p>

//               <p className="text-xs text-muted-foreground">kWh</p>
//               <p className="text-sm text-orange-500">{electricityReading?.note}</p>
//             </div>

//             <div className="min-w-0 rounded-lg border p-3">
//               <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
//                 <Droplets className="h-4 w-4 text-blue-500" />
//                 Nước
//               </div>

//               <p className="mt-2 break-words text-lg font-bold">
//                 {loading
//                   ? "..."
//                   : waterReading
//                     ? formatReading(waterReading.new_value)
//                     : "Chưa nhập"}
//               </p>

//               <p className="text-xs text-muted-foreground">m³</p>
//               <p className="text-sm text-orange-500">{waterReading?.note}</p>
//             </div>
//           </div>

//           {error && (
//             <p className="text-sm text-red-600">{error}</p>
//           )}

//           {canEdit && (
//             <Button
//               variant="outline"
//               className="w-full"
//               onClick={openEditor}
//               disabled={loading}
//             >
//               <Pencil className="mr-2 h-4 w-4" />
//               {electricityReading || waterReading
//                 ? "Cập nhật chỉ số"
//                 : "Nhập chỉ số bàn giao"}
//             </Button>
//           )}
//         </CardContent>
//       </Card>

//       <Dialog
//         open={dialogOpen}
//         onOpenChange={(open) => {
//           if (!saving) setDialogOpen(open);
//         }}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Chỉ số điện nước bàn giao</DialogTitle>
//             <DialogDescription>
//               Nhập số hiển thị thực tế trên công tơ. Hệ thống
//               ghi nhận chỉ số cũ bằng chỉ số mới để mức tiêu
//               thụ tại thời điểm bàn giao bằng 0.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="handover-date">Ngày bàn giao</Label>
//               <Input
//                 id="handover-date"
//                 type="date"
//                 value={readingDate}
//                 onChange={(event) =>
//                   setReadingDate(event.target.value)
//                 }
//                 disabled={saving}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="electricity-reading">
//                 <Zap className="mr-1 inline h-4 w-4 text-amber-500" />
//                 Chỉ số điện (kWh)
//               </Label>

//               <Input
//                 id="electricity-reading"
//                 type="number"
//                 min="0"
//                 step="any"
//                 placeholder="Nhập chỉ số điện"
//                 value={electricityValue}
//                 onChange={(event) =>
//                   setElectricityValue(event.target.value)
//                 }
//                 disabled={saving}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="water-reading">
//                 <Droplets className="mr-1 inline h-4 w-4 text-blue-500" />
//                 Chỉ số nước (m³)
//               </Label>

//               <Input
//                 id="water-reading"
//                 type="number"
//                 min="0"
//                 step="any"
//                 placeholder="Nhập chỉ số nước"
//                 value={waterValue}
//                 onChange={(event) =>
//                   setWaterValue(event.target.value)
//                 }
//                 disabled={saving}
//               />
//             </div>

//             <div className="space-y-2">
//                 <Label htmlFor="handover-note">Ghi chú</Label>
//                 <Textarea
//                     id="handover-note"
//                     placeholder="Nhập ghi chú bàn giao điện nước (nếu có)"
//                     value={note}
//                     onChange={(event) => setNote(event.target.value)}
//                     disabled={saving}
//                     rows={3}
//                 />
//                 </div>

//             {error && (
//               <p className="text-sm text-red-600">{error}</p>
//             )}
//           </div>

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setDialogOpen(false)}
//               disabled={saving}
//             >
//               Hủy
//             </Button>

//             <Button onClick={handleSave} disabled={saving}>
//               {saving ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Đang lưu...
//                 </>
//               ) : (
//                 <>
//                   <Save className="mr-2 h-4 w-4" />
//                   Lưu chỉ số
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }


"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Droplets,
  Gauge,
  Loader2,
  Pencil,
  Save,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MeterType = "ELECTRICITY" | "WATER";

type MeterReading = {
  id: string;
  meterType: MeterType;
  oldValue: number;
  newValue: number;
  consumption: number;
  readingDate: string;
  serviceId: string;
  note?: string | null;
};

type Service = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
};

type Props = {
  contractId: string;
  roomId: string;
  contractStatus: string;
  contractStartDate: string | Date;
};

function getDateInputValue(value: string | Date): string {
  if (typeof value === "string") {
    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

    if (dateOnly) return dateOnly;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReading(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") {
    return "Chưa nhập";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return String(value);

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 3,
  }).format(number);
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function ContractMeterReadings({
  contractId,
  roomId,
  contractStatus,
  contractStartDate,
}: Props) {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [electricityValue, setElectricityValue] = useState("");
  const [waterValue, setWaterValue] = useState("");
  const [note, setNote] = useState("");

  const [readingDate, setReadingDate] = useState(
    getDateInputValue(contractStartDate)
  );

  const canEdit = contractStatus === "ACTIVE";

  const electricityReading = readings.find(
    (item) => item.meterType === "ELECTRICITY"
  );

  const waterReading = readings.find(
    (item) => item.meterType === "WATER"
  );

  const hasInitialReadings =
    Boolean(electricityReading && waterReading);

  // =====================================
  // LOAD DATA
  // =====================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [readingResponse, serviceResponse] = await Promise.all([
        fetch(
          `/api/landlord/rental_contracts/${contractId}/meter_readings/initial`,
          { cache: "no-store" }
        ),
        fetch("/api/landlord/services", {
          cache: "no-store",
        }),
      ]);

      const [readingResult, serviceResult] = await Promise.all([
        readingResponse.json(),
        serviceResponse.json(),
      ]);

      if (!readingResponse.ok || !readingResult.success) {
        throw new Error(
          readingResult.message || "Không thể lấy chỉ số bàn giao."
        );
      }

      if (!serviceResponse.ok || !serviceResult.success) {
        throw new Error(
          serviceResult.message || "Không thể lấy danh sách dịch vụ."
        );
      }

      const readingData =
        readingResult.data?.data ?? readingResult.data;

      const serviceData =
        serviceResult.data?.data ?? serviceResult.data;

      setReadings(
        Array.isArray(readingData?.readings)
          ? readingData.readings
          : []
      );

      setServices(
        Array.isArray(serviceData)
          ? serviceData
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // =====================================
  // OPEN EDITOR
  // =====================================

  const openEditor = () => {
    if (hasInitialReadings) return;

    setElectricityValue("");
    setWaterValue("");
    setNote("");
    setReadingDate(getDateInputValue(contractStartDate));
    setError(null);
    setDialogOpen(true);
  };

  // =====================================
  // FIND SERVICES
  // =====================================

  const findMeterService = (meterType: MeterType) => {
    const keywords =
      meterType === "ELECTRICITY"
        ? ["dien", "electricity", "electric"]
        : ["nuoc", "water"];

    return services.find((service) => {
      if (!service.is_active || service.type !== "METERED") {
        return false;
      }

      const name = normalizeName(service.name);

      return keywords.some((keyword) => name.includes(keyword));
    });
  };

  // =====================================
  // SAVE INITIAL READINGS
  // =====================================

  const handleSave = async () => {
    if (!canEdit || hasInitialReadings) return;

    setError(null);

    if (!readingDate) {
      setError("Vui lòng chọn ngày bàn giao.");
      return;
    }

    const values = [
      electricityValue,
      waterValue,
    ];

    for (const value of values) {
      if (
        value.trim() === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        setError("Vui lòng nhập chỉ số điện và nước hợp lệ.");
        return;
      }
    }

    const electricityService = findMeterService("ELECTRICITY");
    const waterService = findMeterService("WATER");

    if (!electricityService || !waterService) {
      setError(
        "Không tìm thấy dịch vụ điện hoặc nước đang hoạt động có loại METERED."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        type: "INITIAL_HANDOVER",
        roomId,
        contractId,
        readingDate: new Date(
          `${readingDate}T00:00:00+07:00`
        ).toISOString(),
        note: note.trim() || null,
        readings: [
          {
            meterType: "ELECTRICITY",
            serviceId: electricityService.id,
            newValue: Number(electricityValue),
          },
          {
            meterType: "WATER",
            serviceId: waterService.id,
            newValue: Number(waterValue),
          },
        ],
      };

      const response = await fetch("/api/landlord/meter_readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể lưu chỉ số bàn giao."
        );
      }

      await fetchData();
      setDialogOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu chỉ số bàn giao."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Gauge className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Chỉ số bàn giao
              </p>

              <p className="mt-1 text-sm font-semibold">
                {loading
                  ? "Đang tải..."
                  : hasInitialReadings
                    ? "Đã nhập đủ"
                    : readings.length > 0
                      ? "Dữ liệu bàn giao chưa đầy đủ"
                      : "Chưa nhập chỉ số"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-500" />
                Điện
              </div>

              <p className="mt-2 break-words text-lg font-bold">
                {loading
                  ? "..."
                  : electricityReading
                    ? formatReading(electricityReading.newValue)
                    : "Chưa nhập"}
              </p>

              <p className="text-xs text-muted-foreground">kWh</p>

              {electricityReading?.note && (
                <p className="mt-1 text-sm text-orange-500">
                  {electricityReading.note}
                </p>
              )}
            </div>

            <div className="min-w-0 rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-blue-500" />
                Nước
              </div>

              <p className="mt-2 break-words text-lg font-bold">
                {loading
                  ? "..."
                  : waterReading
                    ? formatReading(waterReading.newValue)
                    : "Chưa nhập"}
              </p>

              <p className="text-xs text-muted-foreground">m³</p>

              {waterReading?.note && (
                <p className="mt-1 text-sm text-orange-500">
                  {waterReading.note}
                </p>
              )}
            </div>
          </div>

          {(electricityReading || waterReading) && (
            <p className="text-xs text-muted-foreground">
              Ngày bàn giao:{" "}
              {getDateInputValue(
                electricityReading?.readingDate ??
                  waterReading!.readingDate
              )}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {canEdit && !hasInitialReadings && (
            <Button
              variant="outline"
              className="w-full"
              onClick={openEditor}
              disabled={loading || readings.length > 0}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {readings.length > 0
                ? "Cần kiểm tra dữ liệu bàn giao"
                : "Nhập chỉ số bàn giao"}
            </Button>
          )}

          {hasInitialReadings && (
            <p className="text-xs text-green-600">
              Chỉ số điện và nước bàn giao đã được ghi nhận.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) setDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉ số điện nước bàn giao</DialogTitle>

            <DialogDescription>
              Nhập số hiển thị thực tế trên công tơ tại thời điểm
              bàn giao. Hệ thống ghi nhận chỉ số cũ bằng chỉ số mới,
              nên mức tiêu thụ ban đầu bằng 0.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handover-date">
                Ngày bàn giao
              </Label>

              <Input
                id="handover-date"
                type="date"
                value={readingDate}
                onChange={(event) =>
                  setReadingDate(event.target.value)
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="electricity-reading">
                <Zap className="mr-1 inline h-4 w-4 text-amber-500" />
                Chỉ số điện (kWh)
              </Label>

              <Input
                id="electricity-reading"
                type="number"
                min="0"
                step="any"
                placeholder="Nhập chỉ số điện"
                value={electricityValue}
                onChange={(event) =>
                  setElectricityValue(event.target.value)
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water-reading">
                <Droplets className="mr-1 inline h-4 w-4 text-blue-500" />
                Chỉ số nước (m³)
              </Label>

              <Input
                id="water-reading"
                type="number"
                min="0"
                step="any"
                placeholder="Nhập chỉ số nước"
                value={waterValue}
                onChange={(event) =>
                  setWaterValue(event.target.value)
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handover-note">
                Ghi chú
              </Label>

              <Textarea
                id="handover-note"
                placeholder="Nhập ghi chú bàn giao điện nước (nếu có)"
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                disabled={saving}
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu chỉ số
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
