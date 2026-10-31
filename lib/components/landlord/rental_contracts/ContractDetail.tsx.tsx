
// "use client";

// import { useCallback, useEffect, useState } from "react";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   Eye,
//   Loader2,
//   Pencil,
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Separator } from "@/components/ui/separator";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import type {
//   RentalContractWithDetails,
// } from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

// type ContractDetailProps = {
//   contractId: string;
// };

// type ContractStatus = string;

// const formatCurrency = (value: number | string) => {
//   const amount = Number(value);

//   if (!Number.isFinite(amount)) {
//     return "—";
//   }

//   return new Intl.NumberFormat("vi-VN", {
//     style: "currency",
//     currency: "VND",
//     maximumFractionDigits: 0,
//   }).format(amount);
// };

// const formatDate = (
//   value: Date | string | null | undefined
// ) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return new Intl.DateTimeFormat("vi-VN", {
//     timeZone: "Asia/Ho_Chi_Minh",
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   }).format(date);
// };

// const STATUS_CONFIG: Record<
//   string,
//   { label: string; className: string }
// > = {
//   DRAFT: {
//     label: "Bản nháp",
//     className: "border-gray-200 bg-gray-100 text-gray-700",
//   },
//   ACTIVE: {
//     label: "Đang hiệu lực",
//     className: "border-green-200 bg-green-100 text-green-700",
//   },
//   EXPIRED: {
//     label: "Đã hết hạn",
//     className: "border-orange-200 bg-orange-100 text-orange-700",
//   },
//   TERMINATED: {
//     label: "Đã chấm dứt",
//     className: "border-red-200 bg-red-100 text-red-700",
//   },
//   COMPLETED: {
//     label: "Đã hoàn thành",
//     className: "border-blue-200 bg-blue-100 text-blue-700",
//   },
// };

// const contractStatusItems = [
//   { label: "Trạng thái hợp đồng", value: null },
//   { label: "Đang hiệu lực", value: "ACTIVE" },
//   { label: "Đã hết hạn", value: "EXPIRED" },
//   { label: "Đã chấm dứt", value: "TERMINATED" },
//   { label: "Đã hoàn thành", value: "COMPLETED" },
// ]

// const ROOM_STATUS_CONFIG: Record<
//   string,
//   { label: string; className: string }
// > = {
//   AVAILABLE: {
//     label: "Phòng trống",
//     className: "border-gray-200 bg-gray-100 text-gray-700",
//   },
//   OCCUPIED: {
//     label: "Đang cho thuê",
//     className: "border-green-200 bg-green-100 text-green-700",
//   },
//   MAINTENANCE: {
//     label: "Đang sửa chữa",
//     className: "border-orange-200 bg-orange-100 text-orange-700",
//   },
//   INACTIVE: {
//     label: "Ngừng hoạt động",
//     className: "border-red-200 bg-red-100 text-red-700",
//   },
// };

// const getStatusConfig = (status: string | null | undefined) => {
//   if (!status) {
//     return {
//       label: "Chưa cập nhật",
//       className: "border-gray-200 bg-gray-100 text-gray-700",
//     };
//   }

//   return (
//     STATUS_CONFIG[status] ?? {
//       label: status,
//       className: "border-gray-200 bg-gray-100 text-gray-700",
//     }
//   );
// };

// const getRoomStatusConfig = (
//   status: string | null | undefined
// ) => {
//   if (!status) {
//     return {
//       label: "Chưa cập nhật",
//       className: "border-gray-200 bg-gray-100 text-gray-700",
//     };
//   }

//   return (
//     ROOM_STATUS_CONFIG[status] ?? {
//       label: status,
//       className: "border-gray-200 bg-gray-100 text-gray-700",
//     }
//   );
// };

// export function ContractDetail({
//   contractId,
// }: ContractDetailProps) {
//   const [contract, setContract] =
//     useState<RentalContractWithDetails | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [showStatusEditor, setShowStatusEditor] = useState(false);
//   const [selectedStatus, setSelectedStatus] =
//     useState<ContractStatus>("");
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [updatingStatus, setUpdatingStatus] = useState(false);
//   const [statusMessage, setStatusMessage] =
//     useState<string | null>(null);
//   const [statusError, setStatusError] =
//     useState<string | null>(null);

//   // Lấy thông tin hợp đồng
//   const fetchContract = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(
//         `/api/landlord/rental_contracts/${contractId}`,
//         {
//           cache: "no-store",
//         }
//       );

//       const result = await response.json();

//       if (!response.ok || !result.success) {
//         throw new Error(
//           result.message || "Không thể lấy thông tin hợp đồng."
//         );
//       }

//       const contractData = result.data?.data ?? result.data;

//       if (
//         !contractData ||
//         typeof contractData !== "object" ||
//         Array.isArray(contractData)
//       ) {
//         throw new Error("Dữ liệu hợp đồng không hợp lệ.");
//       }

//       setContract(contractData as RentalContractWithDetails);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Đã xảy ra lỗi khi lấy thông tin hợp đồng."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [contractId]);

//   useEffect(() => {
//     void fetchContract();
//   }, [fetchContract]);

//   // Mở phần chỉnh sửa trạng thái
//   const handleOpenStatusEditor = () => {
//     if (!contract) return;

//     setSelectedStatus(contract.status ?? "");
//     setStatusError(null);
//     setStatusMessage(null);
//     setShowStatusEditor((prev) => !prev);
//   };


//   // Gửi yêu cầu cập nhật trạng thái hợp đồng và đồng bộ trạng thái phòng
//   const handleUpdateStatus = async () => {
//     if (!contract) {
//       setStatusError("Không tìm thấy thông tin hợp đồng.");
//       return;
//     }

//     if (!selectedStatus) {
//       setStatusError("Vui lòng chọn trạng thái hợp đồng.");
//       return;
//     }

//     if (selectedStatus === contract.status) {
//       setStatusError("Trạng thái mới phải khác trạng thái hiện tại.");
//       return;
//     }

//     // Lưu trạng thái cũ trước khi cập nhật
//     const previousStatus = contract.status;

//     // Xác định trạng thái phòng cần cập nhật
//     let roomStatus: "AVAILABLE" | "OCCUPIED" | null = null;

//     if (previousStatus === "ACTIVE" && selectedStatus !== "ACTIVE") {
//       // Hợp đồng từ ACTIVE chuyển sang trạng thái khác
//       roomStatus = "AVAILABLE";
//     } else if (
//       previousStatus !== "ACTIVE" &&
//       selectedStatus === "ACTIVE"
//     ) {
//       // Hợp đồng từ trạng thái khác chuyển sang ACTIVE
//       roomStatus = "OCCUPIED";
//     }

//     try {
//       setUpdatingStatus(true);
//       setStatusError(null);
//       setStatusMessage(null);

//       // BƯỚC 1: Cập nhật trạng thái hợp đồng
//       const response = await fetch(
//         `/api/landlord/rental_contracts/${contractId}`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             status: selectedStatus,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok || !result.success) {
//         throw new Error(
//           result.message || "Không thể cập nhật trạng thái hợp đồng."
//         );
//       }

//       // Lấy dữ liệu hợp đồng sau khi cập nhật
//       const updatedContract = result.data?.data ?? result.data;

//       // Cập nhật giao diện hợp đồng ngay sau khi API thành công
//       if (
//         updatedContract &&
//         typeof updatedContract === "object" &&
//         !Array.isArray(updatedContract) &&
//         "contract_number" in updatedContract
//       ) {
//         setContract(updatedContract as RentalContractWithDetails);
//       } else {
//         setContract((prev) => {
//           if (!prev) return prev;

//           return {
//             ...prev,
//             status: selectedStatus as RentalContractWithDetails["status"],
//           };
//         });
//       }

//       // BƯỚC 2: Nếu cần, cập nhật trạng thái phòng
//       if (roomStatus !== null) {
//         const roomResponse = await fetch(
//           `/api/landlord/rooms/${contract.room_id.toString()}`,
//           {
//             method: "PUT",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               status: roomStatus,
//             }),
//           }
//         );

//         const roomResult = await roomResponse.json();

//         if (!roomResponse.ok || !roomResult.success) {
//           throw new Error(
//             roomResult.message ||
//               "Hợp đồng đã cập nhật nhưng không thể cập nhật trạng thái phòng. Vui lòng kiểm tra lại phòng."
//           );
//         }
//       }

//       // BƯỚC 3: Thông báo thành công
//       setStatusMessage(
//         roomStatus !== null
//           ? "Cập nhật trạng thái hợp đồng và phòng thành công!"
//           : "Cập nhật trạng thái hợp đồng thành công!"
//       );

//       setShowStatusEditor(false);
//       setConfirmOpen(false);
//     } catch (err) {
//       setStatusError(
//         err instanceof Error
//           ? err.message
//           : "Đã xảy ra lỗi khi cập nhật trạng thái."
//       );
//     } finally {
//       setUpdatingStatus(false);
//     }
//   };


//   if (loading) {
//     return (
//       <div className="p-6 text-center text-muted-foreground">
//         Đang tải thông tin hợp đồng...
//       </div>
//     );
//   }

//   if (error || !contract) {
//     return (
//       <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
//         {error ?? "Không tìm thấy hợp đồng."}
//       </div>
//     );
//   }

//   const status = getStatusConfig(contract.status);
//   const roomStatus = getRoomStatusConfig(
//     contract.rooms?.status
//   );

//   const tenants = contract.contract_tenants ?? [];

//   return (
//     <div className="flex flex-col gap-4">
//       {/* Tiêu đề trang */}
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex min-w-0 items-start gap-3">
//           <Link href="/landlord/rental_contracts" >
//             <Button
//               variant="outline"
//               size="icon"
//               className="mt-1 shrink-0 bg-white"
//               aria-label="Quay lại"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>
//           </Link>
          
//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-3">
//               <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
//                 Hợp đồng {contract.contract_number}
//               </h1>

//               <Badge
//                 variant="outline"
//                 className={status.className}
//               >
//                 {status.label}
//               </Badge>
//             </div>

//             <p className="mt-1 text-sm text-slate-500">
//               Chi tiết và thông tin quản lý hợp đồng
//             </p>
//           </div>
//         </div>

//         <Button
//           variant="outline"
//           className="shrink-0"
//           onClick={handleOpenStatusEditor}
//         >
//           <Pencil className="mr-2 h-4 w-4" />
//           <span className="hidden sm:inline">
//             Cập nhật trạng thái
//           </span>
//           <span className="sm:hidden">Cập nhật</span>
//         </Button>
//       </div>

//       {/* Thông báo cập nhật */}
//       {statusMessage && (
//         <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
//           {statusMessage}
//         </div>
//       )}

//       {/* Khu vực chọn trạng thái */}
//       {showStatusEditor && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">
//               Cập nhật trạng thái hợp đồng
//             </CardTitle>

//             <CardDescription>
//               Chọn trạng thái mới cho hợp đồng{" "}
//               {contract.contract_number}.
//             </CardDescription>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="contract-status">
//                 Trạng thái mới
//               </Label>


//               <select
//                 id="contract-status"
//                 value={selectedStatus}
//                 onChange={(event) => {
//                   setSelectedStatus(event.target.value);
//                   setStatusError(null);
//                 }}
//                 disabled={updatingStatus}
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-72"
//               >
//                 <option value="" disabled>
//                   Chọn trạng thái
//                 </option>

//                 {Object.entries(STATUS_CONFIG).map(([value, config]) => (
//                   <option key={value} value={value}>
//                     {config.label}
//                   </option>
//                 ))}
//               </select>

//             </div>

//             {statusError && (
//               <p className="text-sm text-red-600">
//                 {statusError}
//               </p>
//             )}

//             <div className="flex flex-wrap justify-end gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   setShowStatusEditor(false);
//                   setStatusError(null);
//                 }}
//                 disabled={updatingStatus}
//               >
//                 Hủy
//               </Button>

//               <Button
//                 onClick={() => {
//                   if (!selectedStatus) {
//                     setStatusError(
//                       "Vui lòng chọn trạng thái hợp đồng."
//                     );
//                     return;
//                   }

//                   if (selectedStatus === contract.status) {
//                     setStatusError(
//                       "Trạng thái mới phải khác trạng thái hiện tại."
//                     );
//                     return;
//                   }

//                   setStatusError(null);
//                   setConfirmOpen(true);
//                 }}
//                 disabled={
//                   updatingStatus ||
//                   !selectedStatus ||
//                   selectedStatus === contract.status
//                 }
//               >
//                 Cập nhật
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Dialog xác nhận cập nhật */}
//       <Dialog
//         open={confirmOpen}
//         onOpenChange={(open) => {
//           if (!updatingStatus) {
//             setConfirmOpen(open);
//             if (open) setStatusError(null);
//           }
//         }}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               Xác nhận cập nhật trạng thái
//             </DialogTitle>

//             <DialogDescription>
//               Bạn có chắc chắn muốn đổi trạng thái hợp đồng{" "}
//               <span className="font-semibold text-foreground">
//                 {contract.contract_number}
//               </span>{" "}
//               từ{" "}
//               <span className="font-semibold text-foreground">
//                 {getStatusConfig(contract.status).label}
//               </span>{" "}
//               sang{" "}
//               <span className="font-semibold text-foreground">
//                 {getStatusConfig(selectedStatus).label}
//               </span>
//               ?
//             </DialogDescription>
//           </DialogHeader>

//           {statusError && (
//             <p className="text-sm text-red-600">
//               {statusError}
//             </p>
//           )}

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setConfirmOpen(false);
//                 setStatusError(null);
//               }}
//               disabled={updatingStatus}
//             >
//               Quay lại
//             </Button>

//             <Button
//               onClick={handleUpdateStatus}
//               disabled={updatingStatus}
//             >
//               {updatingStatus && (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               )}

//               {updatingStatus
//                 ? "Đang cập nhật..."
//                 : "Xác nhận"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Thông tin cơ bản của hợp đồng */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <div>
//               <CardTitle className="text-lg font-bold text-blue-600">
//                 Thông tin hợp đồng
//               </CardTitle>

//               <CardDescription className="mt-1">
//                 Thông tin cơ bản của hợp đồng thuê phòng
//               </CardDescription>
//             </div>

//             <Badge className={status.className}>
//               {status.label}
//             </Badge>
//           </div>
//         </CardHeader>

//         <CardContent>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Mã hợp đồng
//               </p>
//               <p className="mt-1 font-medium">
//                 {contract.contract_number}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Phòng thuê
//               </p>
//               <p className="mt-1 font-medium">
//                 {contract.rooms?.room_number ?? "—"}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Giá thuê theo hợp đồng
//               </p>
//               <p className="mt-1 font-semibold text-blue-600">
//                 {formatCurrency(String(contract.rent_price))}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Ngày bắt đầu
//               </p>
//               <p className="mt-1 font-medium">
//                 {formatDate(contract.start_date)}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Ngày kết thúc
//               </p>
//               <p className="mt-1 font-medium">
//                 {formatDate(contract.end_date)}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">
//                 Ngày thanh toán hằng tháng
//               </p>
//               <p className="mt-1 font-medium">
//                 Ngày {contract.billing_day}
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Thông tin phòng trọ */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <div>
//               <CardTitle className="text-lg font-bold text-orange-600">
//                 Thông tin phòng trọ
//               </CardTitle>

//               <CardDescription>
//                 Thông tin phòng được sử dụng trong hợp đồng này
//               </CardDescription>
//             </div>

//             <Link href={`/landlord/rooms/${contract.room_id}`} >
//             <Button
//               variant="outline"
//               size="sm"
//             >
//               <Eye className="mr-2 size-4" />
//               Xem chi tiết
//             </Button>
//             </Link>

//           </div>
//         </CardHeader>

//         <Separator />

//         <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
//           <div>
//             <p className="text-sm text-muted-foreground">
//               Tên phòng
//             </p>
//             <p className="text-xl font-bold">
//               {contract.rooms?.room_number ?? "Chưa cập nhật"}
//             </p>
//           </div>

//           <div>
//             <p className="text-sm text-muted-foreground">
//               Diện tích
//             </p>
//             <p className="font-medium">
//               {contract.rooms?.area != null
//                 ? `${contract.rooms.area} m²`
//                 : "Chưa cập nhật"}
//             </p>
//           </div>

//           <div>
//             <p className="text-sm text-muted-foreground">
//               Sức chứa tối đa
//             </p>
//             <p className="font-medium">
//               {contract.rooms?.max_occupants != null
//                 ? `${contract.rooms.max_occupants} người`
//                 : "Chưa cập nhật"}
//             </p>
//           </div>

//           <div>
//             <p className="text-sm text-muted-foreground">
//               Giá thuê niêm yết hiện tại
//             </p>
//             <p className="font-medium">
//               {contract.rooms?.listed_rent != null
//                 ? formatCurrency(
//                     String(contract.rooms.listed_rent)
//                   )
//                 : "Chưa cập nhật"}
//             </p>
//           </div>

//         </CardContent>
//       </Card>

//       {/* Danh sách người thuê */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-bold text-violet-600">
//             Danh sách người thuê
//           </CardTitle>

//           <CardDescription>
//             Có {tenants.length} người trong hợp đồng
//           </CardDescription>
//         </CardHeader>

//         <Separator />

//         <CardContent className="px-0">
//           {tenants.length === 0 ? (
//             <p className="p-6 text-center text-sm text-muted-foreground">
//               Chưa có người thuê trong hợp đồng này.
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead className="pl-6">
//                       STT
//                     </TableHead>
//                     <TableHead>Họ và tên</TableHead>
//                     <TableHead>Số điện thoại</TableHead>
//                     <TableHead>Vai trò</TableHead>
//                     <TableHead>Trạng thái</TableHead>
//                     <TableHead className="pr-6 text-right">
//                       Thao tác
//                     </TableHead>
//                   </TableRow>
//                 </TableHeader>

//                 <TableBody>
//                   {tenants.map((tenant, index) => (
//                     <TableRow key={tenant.id}>
//                       <TableCell className="pl-6">
//                         {index + 1}
//                       </TableCell>

//                       <TableCell className="font-medium">
//                         {tenant.profiles?.full_name ??
//                           "Chưa cập nhật"}
//                       </TableCell>

//                       <TableCell>
//                         {tenant.profiles?.phone ??
//                           "Chưa cập nhật"}
//                       </TableCell>

//                       <TableCell>
//                         <Badge
//                           variant="outline"
//                           className={
//                             tenant.role === "REPRESENTATIVE"
//                               ? "border-blue-200 bg-blue-50 text-blue-700"
//                               : "border-gray-200 bg-gray-50 text-gray-600"
//                           }
//                         >
//                           {tenant.role === "REPRESENTATIVE"
//                             ? "Người đại diện"
//                             : "Thành viên"}
//                         </Badge>
//                       </TableCell>

//                       <TableCell>
//                         <Badge
//                           variant="outline"
//                           className={
//                             tenant.status === "ACTIVE"
//                               ? "border-green-200 bg-green-50 text-green-700"
//                               : "border-gray-200 bg-gray-50 text-gray-600"
//                           }
//                         >
//                           {tenant.status === "ACTIVE"
//                             ? "Đang tham gia"
//                             : tenant.status}
//                         </Badge>
//                       </TableCell>

//                       <TableCell className="pr-6 text-right">
//                         <Link href={`/landlord/profiles/${tenant.profile_id}`}>
//                             <Button
//                               variant="outline"
//                               size="sm"
//                             >
//                               <Eye className="mr-2 size-4" />
//                               Xem chi tiết
//                             </Button>
//                         </Link>
                        
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Users,
  House,
  ReceiptText,
  Banknote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import type {
  RentalContractWithDetails,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

// ======================================================
// TYPES
// ======================================================

type ContractDetailProps = {
  contractId: string;
};

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type ContractDeposit = {
  id: string;
  contract_id: string;
  initial_amount: string;
  status: string;
  received_date: string | null;
  refunded_amount: string;
  deducted_amount: string;
  deduction_reason: string | null;
  settled_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type DepositTransaction = {
  id: string;
  contract_deposit_id: string;
  type: string;
  amount: string;
  transaction_date: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

type DepositTransactionResponse = {
  data: DepositTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// ======================================================
// CONFIG
// ======================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Phòng trống",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  OCCUPIED: {
    label: "Đang cho thuê",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  MAINTENANCE: {
    label: "Đang sửa chữa",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

const DEPOSIT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  NOT_RECEIVED: {
    label: "Chưa thu tiền",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  RECEIVED: {
    label: "Đã thu tiền",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REFUNDED: {
    label: "Đã hoàn cọc",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PARTIALLY_DEDUCTED: {
    label: "Đã khấu trừ một phần",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  FULLY_DEDUCTED: {
    label: "Đã khấu trừ toàn bộ",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  SETTLED: {
    label: "Đã quyết toán",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

const TRANSACTION_CONFIG: Record<
  string,
  { label: string; className: string; sign: string }
> = {
  COLLECT: {
    label: "Thu tiền cọc",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sign: "+",
  },
  REFUND: {
    label: "Hoàn tiền cọc",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    sign: "-",
  },
  DEDUCT: {
    label: "Khấu trừ tiền cọc",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    sign: "-",
  },
};

// ======================================================
// HELPERS
// ======================================================

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (
  value: Date | string | null | undefined
) => {
  if (!value) return "—";

  // Giữ nguyên ngày lịch YYYY-MM-DD, tránh lệch ngày do UTC.
  const dateString =
    typeof value === "string" ? value : value.toISOString();

  const dateOnly = dateString.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (dateOnly) {
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getStatusConfig = (status: string | null | undefined) => {
  if (!status) {
    return {
      label: "Chưa cập nhật",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      className: "border-slate-200 bg-slate-100 text-slate-700",
    }
  );
};

const getRoomStatusConfig = (status: string | null | undefined) => {
  if (!status) {
    return {
      label: "Chưa cập nhật",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return (
    ROOM_STATUS_CONFIG[status] ?? {
      label: status,
      className: "border-slate-200 bg-slate-100 text-slate-700",
    }
  );
};

const getDepositStatusConfig = (status: string | null | undefined) => {
  if (!status) {
    return {
      label: "Chưa cập nhật",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return (
    DEPOSIT_STATUS_CONFIG[status] ?? {
      label: status,
      className: "border-slate-200 bg-slate-100 text-slate-700",
    }
  );
};

const getTransactionConfig = (type: string) => {
  return (
    TRANSACTION_CONFIG[type] ?? {
      label: type,
      className: "border-slate-200 bg-slate-100 text-slate-700",
      sign: "",
    }
  );
};

// ======================================================
// COMPONENT
// ======================================================

export function ContractDetail({
  contractId,
}: ContractDetailProps) {
  const [contract, setContract] =
    useState<RentalContractWithDetails | null>(null);

  const [deposit, setDeposit] =
    useState<ContractDeposit | null>(null);

  const [depositTransactions, setDepositTransactions] =
    useState<DepositTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContractStatus | "">("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [statusMessage, setStatusMessage] =
    useState<string | null>(null);

  const [statusError, setStatusError] =
    useState<string | null>(null);

  // ======================================================
  // FETCH CONTRACT
  // ======================================================

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể lấy thông tin hợp đồng."
        );
      }

      const contractData = result.data?.data ?? result.data;

      if (
        !contractData ||
        typeof contractData !== "object" ||
        Array.isArray(contractData)
      ) {
        throw new Error("Dữ liệu hợp đồng không hợp lệ.");
      }

      setContract(contractData as RentalContractWithDetails);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy thông tin hợp đồng."
      );
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  // ======================================================
  // FETCH DEPOSIT + TRANSACTIONS
  // ======================================================

  const fetchDeposit = useCallback(async () => {
    try {
      setLoadingDeposit(true);
      setDepositError(null);

      const depositResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit`,
        { cache: "no-store" }
      );

      const depositResult = await depositResponse.json();

      if (!depositResponse.ok || !depositResult.success) {
        throw new Error(
          depositResult.message || "Không thể lấy thông tin khoản cọc."
        );
      }

      const depositData: ContractDeposit = depositResult.data;

      setDeposit(depositData);

      const transactionResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit/${depositData.id}/transactions?page=1&limit=100`,
        { cache: "no-store" }
      );

      const transactionResult = await transactionResponse.json();

      if (!transactionResponse.ok || !transactionResult.success) {
        throw new Error(
          transactionResult.message ||
            "Không thể lấy lịch sử giao dịch tiền cọc."
        );
      }

      const transactionData: DepositTransactionResponse =
        transactionResult.data;

      setDepositTransactions(transactionData.data ?? []);
    } catch (err) {
      setDepositError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy thông tin tiền cọc."
      );
    } finally {
      setLoadingDeposit(false);
    }
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
    void fetchDeposit();
  }, [fetchContract, fetchDeposit]);

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  const handleOpenStatusEditor = () => {
    if (!contract) return;

    setSelectedStatus(contract.status as ContractStatus);
    setStatusError(null);
    setStatusMessage(null);
    setShowStatusEditor(true);
  };

  const handleUpdateStatus = async () => {
    if (!contract) {
      setStatusError("Không tìm thấy thông tin hợp đồng.");
      return;
    }

    if (!selectedStatus) {
      setStatusError("Vui lòng chọn trạng thái hợp đồng.");
      return;
    }

    if (selectedStatus === contract.status) {
      setStatusError("Trạng thái mới phải khác trạng thái hiện tại.");
      return;
    }

    const previousStatus = contract.status;

    let roomStatus: "AVAILABLE" | "OCCUPIED" | null = null;

    if (previousStatus === "ACTIVE" && selectedStatus !== "ACTIVE") {
      roomStatus = "AVAILABLE";
    } else if (
      previousStatus !== "ACTIVE" &&
      selectedStatus === "ACTIVE"
    ) {
      roomStatus = "OCCUPIED";
    }

    try {
      setUpdatingStatus(true);
      setStatusError(null);
      setStatusMessage(null);

      // Bước 1: Cập nhật trạng thái hợp đồng
      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể cập nhật trạng thái hợp đồng."
        );
      }

      const updatedContract = result.data?.data ?? result.data;

      if (
        updatedContract &&
        typeof updatedContract === "object" &&
        !Array.isArray(updatedContract) &&
        "contract_number" in updatedContract
      ) {
        setContract(updatedContract as RentalContractWithDetails);
      } else {
        setContract((prev) =>
          prev
            ? {
                ...prev,
                status: selectedStatus as RentalContractWithDetails["status"],
              }
            : prev
        );
      }

      // Bước 2: Đồng bộ trạng thái phòng
      if (roomStatus !== null) {
        const roomResponse = await fetch(
          `/api/landlord/rooms/${contract.room_id.toString()}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: roomStatus,
            }),
          }
        );

        const roomResult = await roomResponse.json();

        if (!roomResponse.ok || !roomResult.success) {
          throw new Error(
            roomResult.message ||
              "Hợp đồng đã cập nhật nhưng trạng thái phòng chưa được đồng bộ."
          );
        }
      }

      // Bước 3: Tải lại hợp đồng, khoản cọc và lịch sử giao dịch
      await Promise.all([
        fetchContract(),
        fetchDeposit(),
      ]);

      setStatusMessage(
        roomStatus !== null
          ? "Cập nhật trạng thái hợp đồng và phòng thành công!"
          : "Cập nhật trạng thái hợp đồng thành công!"
      );

      setShowStatusEditor(false);
      setConfirmOpen(false);
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái."
      );

      // Đồng bộ lại dữ liệu phòng trường hợp API hợp đồng đã thành công
      await fetchContract();
      await fetchDeposit();
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ======================================================
  // LOADING / ERROR
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải thông tin hợp đồng...
          </p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error ?? "Không tìm thấy hợp đồng."}
      </div>
    );
  }

  // ======================================================
  // DERIVED DATA
  // ======================================================

  const status = getStatusConfig(contract.status);
  const roomStatus = getRoomStatusConfig(contract.rooms?.status);
  const tenants = contract.contract_tenants ?? [];

  const depositInitial = Number(deposit?.initial_amount ?? 0);
  const depositRefunded = Number(deposit?.refunded_amount ?? 0);
  const depositDeducted = Number(deposit?.deducted_amount ?? 0);

  const depositBalance = Math.max(
    0,
    depositInitial - depositRefunded - depositDeducted
  );

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <Link href="/landlord/rental_contracts">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0 bg-white"
              aria-label="Quay lại danh sách hợp đồng"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {contract.contract_number}
              </h1>

              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Chi tiết và quản lý thông tin hợp đồng thuê phòng
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="shrink-0"
          onClick={handleOpenStatusEditor}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Cập nhật trạng thái
        </Button>
      </div>

      {/* SUCCESS MESSAGE */}

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {statusMessage}
        </div>
      )}

      {/* ================================================== */}
      {/* STATUS EDITOR */}
      {/* ================================================== */}

      {showStatusEditor && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              Cập nhật trạng thái hợp đồng
            </CardTitle>
            <CardDescription>
              Thay đổi trạng thái cho hợp đồng {contract.contract_number}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="max-w-md space-y-2">
              <Label htmlFor="contract-status">
                Trạng thái mới
              </Label>

              <select
                id="contract-status"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as ContractStatus)
                }
                disabled={updatingStatus}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="" disabled>
                  Chọn trạng thái
                </option>

                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {statusError && (
              <p className="text-sm text-red-600">{statusError}</p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusEditor(false);
                  setStatusError(null);
                }}
                disabled={updatingStatus}
              >
                Hủy
              </Button>

              <Button
                onClick={() => {
                  if (!selectedStatus) {
                    setStatusError("Vui lòng chọn trạng thái hợp đồng.");
                    return;
                  }

                  if (selectedStatus === contract.status) {
                    setStatusError(
                      "Trạng thái mới phải khác trạng thái hiện tại."
                    );
                    return;
                  }

                  setStatusError(null);
                  setConfirmOpen(true);
                }}
                disabled={
                  updatingStatus ||
                  !selectedStatus ||
                  selectedStatus === contract.status
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xác nhận thay đổi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================== */}
      {/* CONFIRM DIALOG */}
      {/* ================================================== */}

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!updatingStatus) {
            setConfirmOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Xác nhận cập nhật trạng thái
            </DialogTitle>

            <DialogDescription>
              Bạn có chắc chắn muốn chuyển hợp đồng{" "}
              <span className="font-semibold text-foreground">
                {contract.contract_number}
              </span>{" "}
              từ{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(contract.status).label}
              </span>{" "}
              sang{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(selectedStatus).label}
              </span>
              ?
              {contract.status === "DRAFT" &&
                selectedStatus === "ACTIVE" && (
                  <span className="mt-3 block rounded-md bg-amber-50 p-3 text-amber-800">
                    Khi kích hoạt, hệ thống sẽ cần xác nhận và ghi nhận
                    khoản tiền cọc theo nghiệp vụ của hợp đồng.
                  </span>
                )}
            </DialogDescription>
          </DialogHeader>

          {statusError && (
            <p className="text-sm text-red-600">{statusError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={updatingStatus}
            >
              Quay lại
            </Button>

            <Button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================== */}
      {/* CONTRACT OVERVIEW */}
      {/* ================================================== */}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Thông tin hợp đồng
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Giá thuê mỗi tháng
                </p>
                <p className="mt-1 truncate text-lg font-bold text-blue-700">
                  {formatCurrency(String(contract.rent_price))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Ngày bắt đầu
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatDate(contract.start_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Ngày kết thúc
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatDate(contract.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <ReceiptText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Ngày thanh toán
                </p>
                <p className="mt-1 text-lg font-bold">
                  Ngày {contract.billing_day}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ================================================== */}
      {/* ROOM INFORMATION */}
      {/* ================================================== */}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <House className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Thông tin phòng thuê
                </CardTitle>
                <CardDescription>
                  Phòng được sử dụng trong hợp đồng này
                </CardDescription>
              </div>
            </div>

            <Link href={`/landlord/rooms/${contract.room_id}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Xem phòng
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Tên phòng</p>
            <p className="mt-1 text-lg font-bold">
              {contract.rooms?.room_number ?? "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Diện tích</p>
            <p className="mt-1 font-semibold">
              {contract.rooms?.area != null
                ? `${contract.rooms.area} m²`
                : "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Sức chứa tối đa</p>
            <p className="mt-1 font-semibold">
              {contract.rooms?.max_occupants != null
                ? `${contract.rooms.max_occupants} người`
                : "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Giá thuê niêm yết
            </p>
            <p className="mt-1 font-semibold">
              {contract.rooms?.listed_rent != null
                ? formatCurrency(String(contract.rooms.listed_rent))
                : "Chưa cập nhật"}
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <Separator className="mb-4" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Trạng thái phòng:
              </span>
              <Badge variant="outline" className={roomStatus.className}>
                {roomStatus.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================== */}
      {/* TENANTS */}
      {/* ================================================== */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Danh sách người thuê
                </CardTitle>
                <CardDescription>
                  Những người tham gia hợp đồng
                </CardDescription>
              </div>
            </div>

            <Badge variant="secondary">
              {tenants.length} người
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="px-0 pt-2">
          {tenants.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có người thuê trong hợp đồng này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">STT</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="pr-6 text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tenants.map((tenant, index) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="pl-6">
                        {index + 1}
                      </TableCell>

                      <TableCell className="font-medium">
                        {tenant.profiles?.full_name ?? "Chưa cập nhật"}
                      </TableCell>

                      <TableCell>
                        {tenant.profiles?.phone ?? "Chưa cập nhật"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tenant.role === "REPRESENTATIVE"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {tenant.role === "REPRESENTATIVE"
                            ? "Người đại diện"
                            : "Thành viên"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tenant.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {tenant.status === "ACTIVE"
                            ? "Đang tham gia"
                            : tenant.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <Link
                          href={`/landlord/profiles/${tenant.profile_id}`}
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================== */}
      {/* DEPOSIT */}
      {/* ================================================== */}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>

              <div>
                <CardTitle className="text-lg">
                  Quản lý tiền cọc
                </CardTitle>
                <CardDescription>
                  Theo dõi khoản cọc và các giao dịch phát sinh
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchDeposit()}
              disabled={loadingDeposit}
            >
              {loadingDeposit ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          {loadingDeposit && !deposit ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải thông tin tiền cọc...
            </div>
          ) : depositError && !deposit ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {depositError}
            </div>
          ) : !deposit ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Chưa có thông tin khoản cọc</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hợp đồng chưa có khoản tiền cọc được ghi nhận.
              </p>
            </div>
          ) : (
            <>
              {depositError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {depositError}
                </div>
              )}

              {/* Deposit status */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Trạng thái khoản cọc
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={getDepositStatusConfig(deposit.status).className}
                    >
                      {getDepositStatusConfig(deposit.status).label}
                    </Badge>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground">
                    Ngày nhận cọc
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatDate(deposit.received_date)}
                  </p>
                </div>
              </div>

              {/* Deposit summary */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    Tiền cọc ban đầu
                  </div>
                  <p className="mt-3 text-xl font-bold">
                    {formatCurrency(deposit.initial_amount)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Số dư cọc
                  </div>
                  <p className="mt-3 text-xl font-bold text-emerald-600">
                    {formatCurrency(depositBalance)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    Đã hoàn trả
                  </div>
                  <p className="mt-3 text-xl font-bold text-blue-600">
                    {formatCurrency(deposit.refunded_amount)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Đã khấu trừ
                  </div>
                  <p className="mt-3 text-xl font-bold text-orange-600">
                    {formatCurrency(deposit.deducted_amount)}
                  </p>
                </div>
              </div>

              {deposit.deduction_reason && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-800">
                    Lý do khấu trừ
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    {deposit.deduction_reason}
                  </p>
                </div>
              )}

              {deposit.note && (
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm font-medium">Ghi chú khoản cọc</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {deposit.note}
                  </p>
                </div>
              )}

              <Separator />

              {/* Transactions */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      Lịch sử giao dịch tiền cọc
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Các khoản thu, hoàn trả và khấu trừ được ghi nhận
                    </p>
                  </div>

                  <Badge variant="secondary">
                    {depositTransactions.length} giao dịch
                  </Badge>
                </div>

                {loadingDeposit && depositTransactions.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải lịch sử giao dịch...
                  </div>
                ) : depositTransactions.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <ReceiptText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">
                      Chưa có giao dịch tiền cọc
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Lịch sử giao dịch sẽ hiển thị tại đây khi có phát sinh.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-5">STT</TableHead>
                          <TableHead>Loại giao dịch</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Ngày giao dịch</TableHead>
                          <TableHead>Mô tả</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {depositTransactions.map((transaction, index) => {
                          const config = getTransactionConfig(
                            transaction.type
                          );

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="pl-5">
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={config.className}
                                >
                                  {config.label}
                                </Badge>
                              </TableCell>

                              <TableCell className="font-semibold">
                                <span
                                  className={
                                    transaction.type === "COLLECT"
                                      ? "text-emerald-600"
                                      : transaction.type === "REFUND" ||
                                          transaction.type === "DEDUCT"
                                        ? "text-orange-600"
                                        : ""
                                  }
                                >
                                  {config.sign}
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </TableCell>

                              <TableCell>
                                {formatDate(transaction.transaction_date)}
                              </TableCell>

                              <TableCell className="max-w-[240px]">
                                <span className="line-clamp-2 text-sm text-muted-foreground">
                                  {transaction.description || "—"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
