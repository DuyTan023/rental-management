
// "use client";

// import { useCallback, useEffect, useState } from "react";
// import { Check, ChevronLeft, ChevronRight } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";

// import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
// import type {
//   ApiResponse,
//   PaginationResult,
// } from "@/lib/types/api.type";

// import StepSelectRoom from "./StepSelectRoom";
// import StepTenants, {
//   type TenantFormData,
//   type TenantFormField,
// } from "./StepTenants";
// import StepContractInfo, {
//   generateContractNumber,
//   type RentalContractFormData,
// } from "./StepContractInfo";
// import StepDepositSummary, {
//   type DepositFormData,
// } from "./StepDepositSummary";

// // ============================================================
// // HELPER
// // ============================================================

// function createEmptyTenant(id: string): TenantFormData {
//   return {
//     id,
//     profile_id: null,
//     full_name: "",
//     email: "",
//     phone: "",
//     identity_number: "",
//     date_of_birth: "",
//     province_code: "",
//     ward_code: "",
//     address_detail: "",
//     role: "MEMBER",
//   };
// }

// const STEPS = [
//   {
//     id: 1,
//     title: "Chọn phòng",
//     description: "Chọn phòng muốn cho thuê",
//   },
//   {
//     id: 2,
//     title: "Người thuê",
//     description: "Thông tin người thuê phòng",
//   },
//   {
//     id: 3,
//     title: "Hợp đồng",
//     description: "Thời hạn và giá thuê",
//   },
//   {
//     id: 4,
//     title: "Tiền cọc",
//     description: "Xác nhận tiền cọc",
//   },
// ];

// // ============================================================
// // COMPONENT
// // ============================================================

// export default function FormCreateRentalContract() {
//   // ----------------------------------------------------------
//   // STEP STATE
//   // ----------------------------------------------------------

//   const [currentStep, setCurrentStep] = useState(1);
//   const [stepError, setStepError] = useState("");

//   // ----------------------------------------------------------
//   // ROOM STATE
//   // ----------------------------------------------------------

//   const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
//     null,
//   );

//   // ----------------------------------------------------------
//   // TENANT STATE
//   // ----------------------------------------------------------

//   const [tenants, setTenants] = useState<TenantFormData[]>([
//     {
//       ...createEmptyTenant("tenant-1"),
//       role: "REPRESENTATIVE",
//     },
//   ]);

//   // ----------------------------------------------------------
//   // CONTRACT STATE
//   // ----------------------------------------------------------

//   const [contract, setContract] = useState<RentalContractFormData>(() => ({
//     contract_number: generateContractNumber(),
//     start_date: "",
//     end_date: "",
//     rent_price: "",
//     billing_day: "",
//     note: "",
//   }));

//   // ----------------------------------------------------------
//   // DEPOSIT STATE
//   // ----------------------------------------------------------

//   const [deposit, setDeposit] = useState<DepositFormData>({
//     initial_amount: "0",
//     status: "NOT_RECEIVED",
//     received_date: "",
//     note: "",
//   });

//   // ----------------------------------------------------------
//   // GET ALL ROOMS
//   // ----------------------------------------------------------

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
//           {
//             cache: "no-store",
//           },
//         );

//         if (!response.ok) {
//           throw new Error("Không thể lấy danh sách phòng");
//         }

//         const result: ApiResponse<
//           PaginationResult<RoomWithCurrentContract>
//         > = await response.json();

//         if (!result.success || !result.data) {
//           throw new Error(
//             result.message || "Lấy danh sách phòng thất bại",
//           );
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

//   useEffect(() => {
//     void getAllRoom();
//   }, [getAllRoom]);

//   // ----------------------------------------------------------
//   // ROOM DATA
//   // ----------------------------------------------------------

//   const availableRooms = rooms.filter(
//     (room) => room.status === "AVAILABLE",
//   );

//   const selectedRoom = rooms.find(
//     (room) => String(room.id) === selectedRoomId,
//   );

//   // ----------------------------------------------------------
//   // TENANT HANDLERS
//   // ----------------------------------------------------------

//   const handleAddTenant = () => {
//     const newTenant = createEmptyTenant(
//       `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
//     );

//     setTenants((prev) => [...prev, newTenant]);
//   };

//   const handleRemoveTenant = (id: string) => {
//     setTenants((prev) => {
//       if (prev.length <= 1) {
//         return prev;
//       }

//       const removedTenant = prev.find(
//         (tenant) => tenant.id === id,
//       );

//       const remainingTenants = prev.filter(
//         (tenant) => tenant.id !== id,
//       );

//       if (removedTenant?.role === "REPRESENTATIVE") {
//         remainingTenants[0] = {
//           ...remainingTenants[0],
//           role: "REPRESENTATIVE",
//         };
//       }

//       return remainingTenants;
//     });
//   };

//   const handleTenantChange = (
//     id: string,
//     field: TenantFormField,
//     value: string | null,
//   ) => {
//     setTenants((prev) =>
//       prev.map((tenant) =>
//         tenant.id === id
//           ? {
//               ...tenant,
//               [field]: value,
//             }
//           : tenant,
//       ),
//     );
//   };

//   const handleSetRepresentative = (id: string) => {
//     setTenants((prev) =>
//       prev.map((tenant) => ({
//         ...tenant,
//         role:
//           tenant.id === id
//             ? "REPRESENTATIVE"
//             : "MEMBER",
//       })),
//     );
//   };

//   // ----------------------------------------------------------
//   // SELECT ROOM
//   // ----------------------------------------------------------

//   const handleSelectRoom = (room: RoomWithCurrentContract) => {
//     setSelectedRoomId(String(room.id));

//     // Lấy giá thuê niêm yết làm giá thuê mặc định.
//     setContract((prev) => ({
//       ...prev,
//       rent_price: String(room.listed_rent ?? ""),
//     }));

//     setStepError("");
//   };

//   const handleChangeRoom = () => {
//     setCurrentStep(1);
//     setStepError("");
//   };

//   // ----------------------------------------------------------
//   // VALIDATE STEP
//   // ----------------------------------------------------------

//   const validateCurrentStep = (): boolean => {
//     setStepError("");

//     // Step 1: Chọn phòng
//     if (currentStep === 1) {
//       if (!selectedRoomId || !selectedRoom) {
//         setStepError("Vui lòng chọn phòng trước khi tiếp tục.");
//         return false;
//       }

//       if (selectedRoom.status !== "AVAILABLE") {
//         setStepError(
//           "Phòng này hiện không còn ở trạng thái có thể cho thuê.",
//         );
//         return false;
//       }

//       return true;
//     }

//     // Step 2: Thông tin người thuê
//     if (currentStep === 2) {
//       if (tenants.length === 0) {
//         setStepError("Vui lòng thêm ít nhất một người thuê.");
//         return false;
//       }

//       const representatives = tenants.filter(
//         (tenant) => tenant.role === "REPRESENTATIVE",
//       );

//       if (representatives.length !== 1) {
//         setStepError(
//           "Hợp đồng phải có đúng một người đại diện.",
//         );
//         return false;
//       }

//       // const invalidTenant = tenants.find(
//       //   (tenant) =>
//       //     !tenant.full_name.trim() ||
//       //     !tenant.phone.trim(),
//       // );

//       // if (invalidTenant) {
//       //   setStepError(
//       //     "Vui lòng nhập đầy đủ họ tên và số điện thoại của tất cả người thuê.",
//       //   );
//       //   return false;
//       // }

//       const invalidTenant = tenants.find((tenant) => {
//         if (!tenant.full_name.trim() || !tenant.phone.trim()) {
//           return true;
//         }

//         // Người thuê mới bắt buộc có email hợp lệ.
//         if (!tenant.profile_id) {
//           const email = tenant.email.trim();

//           if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//             return true;
//           }
//         }

//         return false;
//       });

//       if (invalidTenant) {
//         setStepError(
//           "Vui lòng kiểm tra họ tên, số điện thoại và email của người thuê mới.",
//         );
//         return false;
//       }

//       return true;
//     }

//     // Step 3: Thông tin hợp đồng
//     if (currentStep === 3) {
//       if (!contract.start_date) {
//         setStepError("Vui lòng chọn ngày bắt đầu hợp đồng.");
//         return false;
//       }

//       if (
//         contract.end_date &&
//         contract.end_date < contract.start_date
//       ) {
//         setStepError(
//           "Ngày kết thúc không được nhỏ hơn ngày bắt đầu.",
//         );
//         return false;
//       }

//       const rentPrice = Number(contract.rent_price);

//       if (
//         !contract.rent_price ||
//         !Number.isFinite(rentPrice) ||
//         rentPrice <= 0
//       ) {
//         setStepError("Vui lòng nhập tiền thuê hợp lệ.");
//         return false;
//       }

//       const billingDay = Number(contract.billing_day);

//       if (
//         !contract.billing_day ||
//         !Number.isInteger(billingDay) ||
//         billingDay < 1 ||
//         billingDay > 31
//       ) {
//         setStepError("Vui lòng chọn ngày thanh toán hợp lệ.");
//         return false;
//       }

//       return true;
//     }

//     // Step 4: Tiền cọc
//     if (currentStep === 4) {
//       const initialAmount = Number(deposit.initial_amount);

//       if (
//         deposit.initial_amount.trim() === "" ||
//         !Number.isFinite(initialAmount) ||
//         initialAmount < 0
//       ) {
//         setStepError("Vui lòng nhập số tiền cọc hợp lệ.");
//         return false;
//       }

//       if (
//         deposit.status === "RECEIVED" &&
//         !deposit.received_date
//       ) {
//         setStepError(
//           "Vui lòng chọn ngày thực tế nhận tiền cọc.",
//         );
//         return false;
//       }

//       if (
//         deposit.status === "RECEIVED" &&
//         deposit.received_date > new Date().toISOString().slice(0, 10)
//       ) {
//         setStepError("Ngày nhận cọc không được ở tương lai.");
//         return false;
//       }

//       return true;
//     }

//     return true;
//   };

//   // ----------------------------------------------------------
//   // NAVIGATION
//   // ----------------------------------------------------------

//   const handleNextStep = () => {
//     if (!validateCurrentStep()) {
//       return;
//     }

//     if (currentStep < 4) {
//       setCurrentStep((prev) => prev + 1);
//       setStepError("");
//     }
//   };

//   const handlePreviousStep = () => {
//     if (currentStep > 1) {
//       setCurrentStep((prev) => prev - 1);
//       setStepError("");
//     }
//   };

//   // ----------------------------------------------------------
//   // TEMPORARY SUBMIT
//   // ----------------------------------------------------------

//   const handleSubmit = () => {
//     if (!validateCurrentStep()) {
//       return;
//     }

//     const payload = {
//       room_id: selectedRoomId,

//       tenants: tenants.map((tenant) => ({
//         profile_id: tenant.profile_id,
//         full_name: tenant.full_name.trim(),
//         phone: tenant.phone.trim(),
//         identity_number: tenant.identity_number || null,
//         date_of_birth: tenant.date_of_birth || null,
//         province_code: tenant.province_code || null,
//         ward_code: tenant.ward_code || null,
//         address_detail: tenant.address_detail.trim() || null,
//         role: tenant.role,
//       })),

//       contract: {
//         contract_number: contract.contract_number,
//         start_date: contract.start_date,
//         end_date: contract.end_date || null,
//         rent_price: Number(contract.rent_price),
//         billing_day: Number(contract.billing_day),
//         note: contract.note.trim() || null,
//       },

//       deposit: {
//         initial_amount: Number(deposit.initial_amount),
//         status: deposit.status,
//         received_date:
//           deposit.status === "RECEIVED"
//             ? deposit.received_date || null
//             : null,
//         note: deposit.note.trim() || null,
//       },
//     };

//     // Tạm thời kiểm tra dữ liệu trước khi kết nối API.
//     console.log("Dữ liệu tạo hợp đồng:", payload);
//   };

//   // ----------------------------------------------------------
//   // RENDER LOADING / ERROR
//   // ----------------------------------------------------------

//   if (loading) {
//     return (
//       <p className="text-sm text-muted-foreground">
//         Đang tải danh sách phòng...
//       </p>
//     );
//   }

//   if (error) {
//     return (
//       <div className="space-y-3">
//         <p className="text-sm text-red-500">{error}</p>

//         <Button
//           type="button"
//           variant="outline"
//           onClick={getAllRoom}
//         >
//           Thử lại
//         </Button>
//       </div>
//     );
//   }

//   // ----------------------------------------------------------
//   // RENDER
//   // ----------------------------------------------------------

//   return (
//     <div className="space-y-6">
//       {/* STEP INDICATOR */}

//       <Card className="p-4">
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//           {STEPS.map((step) => {
//             const isActive = currentStep === step.id;
//             const isCompleted = currentStep > step.id;

//             return (
//               <button
//                 key={step.id}
//                 type="button"
//                 onClick={() => {
//                   if (step.id < currentStep) {
//                     setCurrentStep(step.id);
//                     setStepError("");
//                   }
//                 }}
//                 disabled={step.id > currentStep}
//                 className="flex min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed"
//               >
//                 <div
//                   className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
//                     isCompleted
//                       ? "border-primary bg-primary text-primary-foreground"
//                       : isActive
//                         ? "border-primary bg-primary/10 text-primary"
//                         : "border-muted bg-muted text-muted-foreground"
//                   }`}
//                 >
//                   {isCompleted ? (
//                     <Check className="h-4 w-4" />
//                   ) : (
//                     step.id
//                   )}
//                 </div>

//                 <div className="min-w-0">
//                   <p
//                     className={`truncate text-sm font-semibold ${
//                       isActive
//                         ? "text-primary"
//                         : "text-foreground"
//                     }`}
//                   >
//                     {step.title}
//                   </p>

//                   <p className="hidden truncate text-xs text-muted-foreground sm:block">
//                     {step.description}
//                   </p>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </Card>

//       {/* STEP 1: CHỌN PHÒNG */}

//       {currentStep === 1 && (
//         <StepSelectRoom
//           rooms={availableRooms}
//           selectedRoomId={selectedRoomId}
//           onSelectRoom={handleSelectRoom}
//         />
//       )}

//       {/* STEP 2: NGƯỜI THUÊ */}

//       {currentStep === 2 && (
//         <StepTenants
//           tenants={tenants}
//           onAddTenant={handleAddTenant}
//           onRemoveTenant={handleRemoveTenant}
//           onTenantChange={handleTenantChange}
//           onSetRepresentative={handleSetRepresentative}
//         />
//       )}

//       {/* STEP 3: HỢP ĐỒNG */}

//       {currentStep === 3 && (
//         <StepContractInfo
//           contract={contract}
//           selectedRoom={selectedRoom}
//           onContractChange={setContract}
//           onChangeRoom={handleChangeRoom}
//         />
//       )}

//       {/* STEP 4: TIỀN CỌC VÀ XÁC NHẬN */}

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

//       {/* VALIDATION ERROR */}

//       {stepError && (
//         <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
//           {stepError}
//         </p>
//       )}

//       {/* NAVIGATION BUTTONS */}

//       <div className="flex items-center justify-between gap-3">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={handlePreviousStep}
//           disabled={currentStep === 1}
//         >
//           <ChevronLeft className="mr-2 h-4 w-4" />
//           Quay lại
//         </Button>

//         {currentStep < 4 ? (
//           <Button
//             type="button"
//             onClick={handleNextStep}
//           >
//             Tiếp tục
//             <ChevronRight className="ml-2 h-4 w-4" />
//           </Button>
//         ) : (
//           <Button
//             type="button"
//             onClick={handleSubmit}
//           >
//             Hoàn tất
//             <Check className="ml-2 h-4 w-4" />
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import type {
  ApiResponse,
  PaginationResult,
} from "@/lib/types/api.type";

import StepSelectRoom from "./StepSelectRoom";
import StepTenants, {
  type TenantFormData,
  type TenantFormField,
} from "./StepTenants";
import StepContractInfo, {
  generateContractNumber,
  type RentalContractFormData,
} from "./StepContractInfo";
import StepDepositSummary, {
  type DepositFormData,
} from "./StepDepositSummary";

// ============================================================
// HELPER
// ============================================================

function createEmptyTenant(id: string): TenantFormData {
  return {
    id,
    profile_id: null,
    full_name: "",
    email: "",
    phone: "",
    identity_number: "",
    date_of_birth: "",
    province_code: "",
    ward_code: "",
    address_detail: "",
    role: "MEMBER",
  };
}

const STEPS = [
  {
    id: 1,
    title: "Chọn phòng",
    description: "Chọn phòng muốn cho thuê",
  },
  {
    id: 2,
    title: "Người thuê",
    description: "Thông tin người thuê phòng",
  },
  {
    id: 3,
    title: "Hợp đồng",
    description: "Thời hạn và giá thuê",
  },
  {
    id: 4,
    title: "Tiền cọc",
    description: "Xác nhận tiền cọc",
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function FormCreateRentalContract() {
  // ----------------------------------------------------------
  // STEP STATE
  // ----------------------------------------------------------

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");

  // ----------------------------------------------------------
  // ROOM STATE
  // ----------------------------------------------------------

  const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    null,
  );

  // ----------------------------------------------------------
  // SUBMIT STATE
  // ----------------------------------------------------------

  const [submitting, setSubmitting] = useState(false);

  // ----------------------------------------------------------
  // TENANT STATE
  // ----------------------------------------------------------

  const [tenants, setTenants] = useState<TenantFormData[]>([
    {
      ...createEmptyTenant("tenant-1"),
      role: "REPRESENTATIVE",
    },
  ]);

  // ----------------------------------------------------------
  // CONTRACT STATE
  // ----------------------------------------------------------

  const [contract, setContract] = useState<RentalContractFormData>(() => ({
    contract_number: generateContractNumber(),
    start_date: "",
    end_date: "",
    rent_price: "",
    billing_day: "",
    note: "",
  }));

  // ----------------------------------------------------------
  // DEPOSIT STATE
  // ----------------------------------------------------------

  const [deposit, setDeposit] = useState<DepositFormData>({
    initial_amount: "0",
    status: "NOT_RECEIVED",
    received_date: "",
    note: "",
  });

  // ----------------------------------------------------------
  // GET ALL ROOMS
  // ----------------------------------------------------------

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
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phòng");
        }

        const result: ApiResponse<
          PaginationResult<RoomWithCurrentContract>
        > = await response.json();

        if (!result.success || !result.data) {
          throw new Error(
            result.message || "Lấy danh sách phòng thất bại",
          );
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

  // ----------------------------------------------------------
  // ROOM DATA
  // ----------------------------------------------------------

  const availableRooms = rooms.filter(
    (room) => room.status === "AVAILABLE",
  );

  const selectedRoom = rooms.find(
    (room) => String(room.id) === selectedRoomId,
  );

  // ----------------------------------------------------------
  // TENANT HANDLERS
  // ----------------------------------------------------------

  const handleAddTenant = () => {
    const newTenant = createEmptyTenant(
      `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    );

    setTenants((prev) => [...prev, newTenant]);
  };

  const handleRemoveTenant = (id: string) => {
    setTenants((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      const removedTenant = prev.find(
        (tenant) => tenant.id === id,
      );

      const remainingTenants = prev.filter(
        (tenant) => tenant.id !== id,
      );

      if (removedTenant?.role === "REPRESENTATIVE") {
        remainingTenants[0] = {
          ...remainingTenants[0],
          role: "REPRESENTATIVE",
        };
      }

      return remainingTenants;
    });
  };

  const handleTenantChange = (
    id: string,
    field: TenantFormField,
    value: string | null,
  ) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === id
          ? {
              ...tenant,
              [field]: value,
            }
          : tenant,
      ),
    );
  };

  const handleSetRepresentative = (id: string) => {
    setTenants((prev) =>
      prev.map((tenant) => ({
        ...tenant,
        role: tenant.id === id ? "REPRESENTATIVE" : "MEMBER",
      })),
    );
  };

  // ----------------------------------------------------------
  // SELECT ROOM
  // ----------------------------------------------------------

  const handleSelectRoom = (room: RoomWithCurrentContract) => {
    setSelectedRoomId(String(room.id));

    setContract((prev) => ({
      ...prev,
      rent_price: String(room.listed_rent ?? ""),
    }));

    setStepError("");
  };

  const handleChangeRoom = () => {
    setCurrentStep(1);
    setStepError("");
  };

  // ----------------------------------------------------------
  // VALIDATE STEP
  // ----------------------------------------------------------

  const validateCurrentStep = (): boolean => {
    setStepError("");

    // Step 1: Chọn phòng
    if (currentStep === 1) {
      if (!selectedRoomId || !selectedRoom) {
        setStepError("Vui lòng chọn phòng trước khi tiếp tục.");
        return false;
      }

      if (selectedRoom.status !== "AVAILABLE") {
        setStepError(
          "Phòng này hiện không còn ở trạng thái có thể cho thuê.",
        );
        return false;
      }

      return true;
    }

    // Step 2: Thông tin người thuê
    if (currentStep === 2) {
      if (tenants.length === 0) {
        setStepError("Vui lòng thêm ít nhất một người thuê.");
        return false;
      }

      const representatives = tenants.filter(
        (tenant) => tenant.role === "REPRESENTATIVE",
      );

      if (representatives.length !== 1) {
        setStepError("Hợp đồng phải có đúng một người đại diện.");
        return false;
      }

      const invalidTenant = tenants.find((tenant) => {
        if (!tenant.full_name.trim() || !tenant.phone.trim()) {
          return true;
        }

        // Người thuê mới bắt buộc có email hợp lệ.
        if (!tenant.profile_id) {
          const email = tenant.email.trim();

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return true;
          }
        }

        return false;
      });

      if (invalidTenant) {
        setStepError(
          "Vui lòng kiểm tra họ tên, số điện thoại và email của người thuê mới.",
        );
        return false;
      }

      return true;
    }

    // Step 3: Thông tin hợp đồng
    if (currentStep === 3) {
      if (!contract.start_date) {
        setStepError("Vui lòng chọn ngày bắt đầu hợp đồng.");
        return false;
      }

      if (
        contract.end_date &&
        contract.end_date < contract.start_date
      ) {
        setStepError(
          "Ngày kết thúc không được nhỏ hơn ngày bắt đầu.",
        );
        return false;
      }

      const rentPrice = Number(contract.rent_price);

      if (
        !contract.rent_price ||
        !Number.isFinite(rentPrice) ||
        rentPrice <= 0
      ) {
        setStepError("Vui lòng nhập tiền thuê hợp lệ.");
        return false;
      }

      const billingDay = Number(contract.billing_day);

      if (
        !contract.billing_day ||
        !Number.isInteger(billingDay) ||
        billingDay < 1 ||
        billingDay > 31
      ) {
        setStepError("Vui lòng chọn ngày thanh toán hợp lệ.");
        return false;
      }

      return true;
    }

    // Step 4: Tiền cọc
    if (currentStep === 4) {
      const initialAmount = Number(deposit.initial_amount);

      if (
        deposit.initial_amount.trim() === "" ||
        !Number.isFinite(initialAmount) ||
        initialAmount < 0
      ) {
        setStepError("Vui lòng nhập số tiền cọc hợp lệ.");
        return false;
      }

      if (
        deposit.status === "RECEIVED" &&
        !deposit.received_date
      ) {
        setStepError(
          "Vui lòng chọn ngày thực tế nhận tiền cọc.",
        );
        return false;
      }

      if (
        deposit.status === "RECEIVED" &&
        deposit.received_date > new Date().toISOString().slice(0, 10)
      ) {
        setStepError("Ngày nhận cọc không được ở tương lai.");
        return false;
      }

      return true;
    }

    return true;
  };

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      setStepError("");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1 && !submitting) {
      setCurrentStep((prev) => prev - 1);
      setStepError("");
    }
  };

  // ----------------------------------------------------------
  // SUBMIT CREATE RENTAL CONTRACT
  // ----------------------------------------------------------

  const handleSubmit = async () => {
    if (submitting || !validateCurrentStep()) {
      return;
    }

    if (!selectedRoomId) {
      setStepError("Không tìm thấy phòng được chọn.");
      return;
    }

    try {
      setSubmitting(true);
      setStepError("");

      const payload = {
        inputRentalContract: {
          room_id: selectedRoomId,
          contract_number: contract.contract_number.trim(),
          start_date: contract.start_date,
          end_date: contract.end_date || null,
          rent_price: Number(contract.rent_price),
          billing_day: Number(contract.billing_day),
          note: contract.note.trim() || null,

          // Không gửi status từ client.
          // Backend bắt buộc tự đặt status = DRAFT.
        },

        tenants: tenants.map((tenant) => {
          // Người thuê đã có hồ sơ:
          // Chỉ liên kết bằng profile_id.
          if (tenant.profile_id) {
            return {
              profile_id: tenant.profile_id,
              is_representative:
                tenant.role === "REPRESENTATIVE",
            };
          }

          // Người thuê mới:
          // Tạo users và profiles trong transaction backend.
          return {
            is_representative:
              tenant.role === "REPRESENTATIVE",

            inputUser: {
              email: tenant.email.trim(),
              password_hash: null,
              role: "TENANT",
              // Không truyền status để Prisma tự dùng INACTIVE.
            },

            inputProfile: {
              full_name: tenant.full_name.trim(),
              phone: tenant.phone.trim(),
              identity_number:
                tenant.identity_number.trim() || null,
              date_of_birth: tenant.date_of_birth || null,
              province_code: tenant.province_code || null,
              ward_code: tenant.ward_code || null,
              address_detail:
                tenant.address_detail.trim() || null,
            },
          };
        }),

        deposit: {
          initial_amount: Number(deposit.initial_amount),
          status: deposit.status,
          received_date:
            deposit.status === "RECEIVED"
              ? deposit.received_date || null
              : null,
          note: deposit.note.trim() || null,
        },
      };

      const response = await fetch(
        "/api/landlord/rental_contracts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tạo hợp đồng.",
        );
      }

      toast.success("Hợp đồng đã được lưu ở bản nháp");

      // Tải lại danh sách phòng để cập nhật dữ liệu mới nhất.
      await getAllRoom();
    } catch (err) {
      console.error("Lỗi tạo hợp đồng:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tạo hợp đồng.";

      setStepError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER LOADING / ERROR
  // ----------------------------------------------------------

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Đang tải danh sách phòng...
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">{error}</p>

        <Button
          type="button"
          variant="outline"
          onClick={getAllRoom}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* STEP INDICATOR */}

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep && !submitting) {
                    setCurrentStep(step.id);
                    setStepError("");
                  }
                }}
                disabled={step.id > currentStep || submitting}
                className="flex min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isActive
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </p>

                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STEP 1: CHỌN PHÒNG */}

      {currentStep === 1 && (
        <StepSelectRoom
          rooms={availableRooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
        />
      )}

      {/* STEP 2: NGƯỜI THUÊ */}

      {currentStep === 2 && (
        <StepTenants
          tenants={tenants}
          onAddTenant={handleAddTenant}
          onRemoveTenant={handleRemoveTenant}
          onTenantChange={handleTenantChange}
          onSetRepresentative={handleSetRepresentative}
        />
      )}

      {/* STEP 3: HỢP ĐỒNG */}

      {currentStep === 3 && (
        <StepContractInfo
          contract={contract}
          selectedRoom={selectedRoom}
          onContractChange={setContract}
          onChangeRoom={handleChangeRoom}
        />
      )}

      {/* STEP 4: TIỀN CỌC VÀ XÁC NHẬN */}

      {currentStep === 4 && (
        <StepDepositSummary
          deposit={deposit}
          contract={contract}
          tenants={tenants}
          selectedRoom={selectedRoom}
          onDepositChange={setDeposit}
          onGoToStep={setCurrentStep}
        />
      )}

      {/* VALIDATION ERROR */}

      {stepError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {stepError}
        </p>
      )}

      {/* NAVIGATION BUTTONS */}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1 || submitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={submitting}
          >
            Tiếp tục
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                Đang lưu...
              </>
            ) : (
              <>
                Hoàn tất
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
