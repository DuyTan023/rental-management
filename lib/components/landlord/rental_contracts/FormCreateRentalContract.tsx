// "use client";

// import {
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   ClipboardList,
//   FileText,
//   House,
//   Users,
//   Wallet,
// } from "lucide-react";
// import { useCallback, useState } from "react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
// import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";
// import StepContractInfo, {
//   type RentalContractFormData,
// } from "./StepContractInfo";
// import StepDepositSummary, { type DepositFormData } from "./StepDepositSummary";
// import StepSelectRoom from "./StepSelectRoom";
// import type { TenantFormData } from "./StepTenants";
// import StepTenants from "./StepTenants";

// // ============================================================
// // HELPER
// // ============================================================

// function createEmptyTenant(id: string): TenantFormData {
//   return {
//     id,
//     full_name: "",
//     phone: "",
//     identity_number: "",
//     date_of_birth: "",
//     province_code: "",
//     ward_code: "",
//     address_detail: "",
//     role: "MEMBER",
//   };
// }

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// export default function FormCreateRentalContract() {
//   // Danh sách phòng
//   const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentStep, setCurrentStep] = useState(1);

//   // Bước 1: Phòng
//   const [selectedRoomId, setSelectedRoomId] = useState<bigint | null>(null);

//   // Bước 2: Người thuê
//   const [tenants, setTenants] = useState<TenantFormData[]>([
//     {
//       ...createEmptyTenant("tenant-1"),
//       role: "REPRESENTATIVE",
//     },
//   ]);

//   // Bước 3: Hợp đồng
//   const [contract, setContract] = useState<RentalContractFormData>({
//     contract_number: "",
//     start_date: "",
//     end_date: "",
//     rent_price: "",
//     billing_day: "5",
//     note: "",
//   });

//   // Bước 4: Tiền cọc
//   const [deposit, setDeposit] = useState<DepositFormData>({
//     initial_amount: "",
//     received_date: "",
//     note: "",
//   });

//   const progress = (currentStep / 4) * 100;

//   const steps = [
//     {
//       id: 1,
//       title: "Chọn phòng",
//       description: "Thông tin phòng thuê",
//       icon: House,
//     },
//     {
//       id: 2,
//       title: "Người thuê",
//       description: "Thông tin các thành viên",
//       icon: Users,
//     },
//     {
//       id: 3,
//       title: "Hợp đồng",
//       description: "Thời hạn và giá thuê",
//       icon: FileText,
//     },
//     {
//       id: 4,
//       title: "Tiền cọc",
//       description: "Tiền cọc và xác nhận",
//       icon: Wallet,
//     },
//   ];

//   // ==========================================================
//   // HANDLERS
//   // ==========================================================

//   function handleAddTenant() {
//     setTenants((prev) => [...prev, createEmptyTenant(`tenant-${Date.now()}`)]);
//   }

//   function handleRemoveTenant(id: string) {
//     setTenants((prev) => {
//       const removedTenant = prev.find((tenant) => tenant.id === id);
//       const next = prev.filter((tenant) => tenant.id !== id);

//       // Nếu xóa người đại diện, chọn người đầu tiên còn lại.
//       if (removedTenant?.role === "REPRESENTATIVE" && next.length > 0) {
//         next[0] = {
//           ...next[0],
//           role: "REPRESENTATIVE",
//         };
//       }

//       return next;
//     });
//   }

//   function handleTenantChange(
//     id: string,
//     field: keyof TenantFormData,
//     value: string,
//   ) {
//     setTenants((prev) =>
//       prev.map((tenant) =>
//         tenant.id === id ? { ...tenant, [field]: value } : tenant,
//       ),
//     );
//   }

//   function handleSetRepresentative(id: string) {
//     setTenants((prev) =>
//       prev.map((tenant) => ({
//         ...tenant,
//         role: tenant.id === id ? "REPRESENTATIVE" : "MEMBER",
//       })),
//     );
//   }

//   function handleNext() {
//     setCurrentStep((prev) => Math.min(prev + 1, 4));
//   }

//   function handlePrevious() {
//     setCurrentStep((prev) => Math.max(prev - 1, 1));
//   }

//   function handleFinish() {
//     // Chỉ phục vụ kiểm tra giao diện, chưa gọi API.
//     console.log("Thông tin hợp đồng mẫu:", {
//       room: selectedRoom,
//       tenants,
//       contract,
//       deposit,
//     });

//     alert(
//       "Đây là giao diện tĩnh. Chức năng tạo hợp đồng chưa được kết nối API.",
//     );
//   }

//   //Gọi API lấy danh sách các phòng
//   const getAllRoom = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const limit = 100;
//       let page = 1;
//       let totalPage = 1;

//       const allRooms: RoomWithCurrentContract[] = [];

//       do {
//         const response = await fetch(
//           `/api/landlord/rooms?page=${page}&limit=${limit}`,
//         );

//         if (!response.ok) {
//           throw new Error("Không thể lấy danh sách phòng");
//         }

//         const result: ApiResponse<PaginationResult<RoomWithCurrentContract>> =
//           await response.json();

//         if (!result.success || !result.data) {
//           throw new Error(result.message || "Lấy danh sách phòng thất bại");
//         }

//         allRooms.push(...result.data.data);

//         totalPage = result.data.totalPage;
//         page++;
//       } while (page <= totalPage);

//       setRooms(allRooms);
//     } catch (err) {
//       console.error("Lỗi lấy danh sách phòng:", err);

//       setError(
//         err instanceof Error
//           ? err.message
//           : "Đã xảy ra lỗi khi lấy danh sách phòng",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Gọi API khi component đc mount
//   // useEffect(() => {
//   //   void getAllRoom();
//   // }, [getAllRoom]);

//   // Chỉ lấy các phòng còn trống
//   const availableRooms = rooms.filter((room) => room.status === "AVAILABLE");
//   setRooms(availableRooms);

//   //Hàm gán selectRoomId
//   const handleSelectRoom = (room: RoomWithCurrentContract) => {
//     setSelectedRoomId(room.id);
//   };

//   // duyệt lấy phòng đang đc chọn để tạo hợp đồng
//   const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

//   // ==========================================================
//   // RENDER
//   // ==========================================================

//   return (
//     <div className="mx-auto w-full space-y-6 pb-10">
//       {/* Header */}

//       <div className="space-y-2">
//         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//           <span>Hợp đồng</span>
//           <span>/</span>
//           <span className="text-foreground">Tạo hợp đồng</span>
//         </div>

//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight">
//               Tạo hợp đồng thuê phòng
//             </h1>

//             <p className="mt-1 text-sm text-muted-foreground">
//               Điền thông tin theo từng bước để tạo hợp đồng thuê phòng mới.
//             </p>
//           </div>

//           <Badge variant="outline" className="w-fit gap-1.5 py-1">
//             <ClipboardList className="h-3.5 w-3.5" />
//             Bản nháp giao diện
//           </Badge>
//         </div>
//       </div>

//       {/* Stepper */}

//       <Card>
//         <CardContent className="space-y-5 p-5">
//           <div className="flex items-center justify-between gap-2">
//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Bước {currentStep} / 4
//               </p>

//               <p className="font-semibold">{steps[currentStep - 1].title}</p>
//             </div>

//             <p className="text-sm font-medium text-muted-foreground">
//               {Math.round(progress)}%
//             </p>
//           </div>

//           <Progress value={progress} className="h-2" />

//           <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
//             {steps.map((step) => {
//               const Icon = step.icon;
//               const isActive = currentStep === step.id;
//               const isCompleted = currentStep > step.id;

//               return (
//                 <button
//                   key={step.id}
//                   type="button"
//                   onClick={() => setCurrentStep(step.id)}
//                   className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
//                     isActive
//                       ? "border-primary bg-primary/5"
//                       : isCompleted
//                         ? "border-green-200 bg-green-50/50"
//                         : "border-border hover:bg-muted/50"
//                   }`}
//                 >
//                   <div
//                     className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
//                       isActive
//                         ? "bg-primary text-primary-foreground"
//                         : isCompleted
//                           ? "bg-green-100 text-green-700"
//                           : "bg-muted text-muted-foreground"
//                     }`}
//                   >
//                     {isCompleted ? (
//                       <Check className="h-4 w-4" />
//                     ) : (
//                       <Icon className="h-4 w-4" />
//                     )}
//                   </div>

//                   <div className="min-w-0">
//                     <p className="text-sm font-medium">{step.title}</p>

//                     <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
//                       {step.description}
//                     </p>
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Step 1: Chọn phòng */}

//       {currentStep === 1 && (
//         <StepSelectRoom
//           rooms={MOCK_ROOMS}
//           selectedRoomId={selectedRoomId}
//           onSelectRoom={handleSelectRoom}
//         />
//       )}

//       {/* Step 2: Người thuê */}

//       {currentStep === 2 && (
//         <StepTenants
//           tenants={tenants}
//           onAddTenant={handleAddTenant}
//           onRemoveTenant={handleRemoveTenant}
//           onTenantChange={handleTenantChange}
//           onSetRepresentative={handleSetRepresentative}
//         />
//       )}

//       {/* Step 3: Thông tin hợp đồng */}

//       {currentStep === 3 && (
//         <StepContractInfo
//           contract={contract}
//           selectedRoom={selectedRoom}
//           onContractChange={setContract}
//           onChangeRoom={() => setCurrentStep(1)}
//         />
//       )}

//       {/* Step 4: Tiền cọc và xác nhận */}

//       {currentStep === 4 && (
//         <StepDepositSummary
//           deposit={deposit}
//           contract={contract}
//           tenants={tenants}
//           selectedRoom={selectedRoom}
//           onDepositChange={setDeposit}
//           onGoToStep={setCurrentStep}
//         />
//       )}

//       {/* Footer navigation */}

//       <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
//         <div className="flex items-center justify-between gap-3">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={handlePrevious}
//             disabled={currentStep === 1}
//           >
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Quay lại
//           </Button>

//           <div className="flex items-center gap-1.5">
//             {steps.map((step) => (
//               <div
//                 key={step.id}
//                 className={`h-1.5 rounded-full transition-all ${
//                   currentStep === step.id
//                     ? "w-6 bg-primary"
//                     : currentStep > step.id
//                       ? "w-3 bg-primary/50"
//                       : "w-3 bg-muted"
//                 }`}
//               />
//             ))}
//           </div>

//           {currentStep < 4 ? (
//             <Button type="button" onClick={handleNext}>
//               Tiếp tục
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//           ) : (
//             <Button type="button" onClick={handleFinish}>
//               <Check className="mr-2 h-4 w-4" />
//               Xác nhận tạo hợp đồng
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useCallback, useEffect, useState } from "react";

import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";

import StepSelectRoom from "./StepSelectRoom";

export default function FormCreateRentalContract() {
  const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Lấy danh sách phòng từ API
  const getAllRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const limit = 100;
      let page = 1;
      let totalPage = 1;

      const allRooms: RoomWithCurrentContract[] = [];

      do {
        const response = await fetch(
          `/api/landlord/rooms?page=${page}&limit=${limit}`,
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phòng");
        }

        const result: ApiResponse<PaginationResult<RoomWithCurrentContract>> =
          await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.message || "Lấy danh sách phòng thất bại");
        }

        allRooms.push(...result.data.data);

        totalPage = result.data.totalPage;
        page++;
      } while (page <= totalPage);

      setRooms(allRooms);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy danh sách phòng",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getAllRoom();
  }, [getAllRoom]);

  // Chỉ lấy các phòng còn trống
  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE");

  // Xử lý chọn phòng
  const handleSelectRoom = (room: RoomWithCurrentContract) => {
    setSelectedRoomId(String(room.id));
  };

  // Lấy thông tin phòng đã chọn
  const selectedRoom = rooms.find((room) => String(room.id) === selectedRoomId);

  if (loading) {
    return <p>Đang tải danh sách phòng...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <StepSelectRoom
        rooms={availableRooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={handleSelectRoom}
      />

      {/* Tạm thời kiểm tra phòng đã chọn */}
      {selectedRoom && <p>Phòng đã chọn: {selectedRoom.room_number}</p>}
    </div>
  );
}
