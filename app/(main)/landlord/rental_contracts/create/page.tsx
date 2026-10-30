import FormCreateRentalContract from "@/lib/components/landlord/rental_contracts/FormCreateRentalContract";

export default function CreateContractPage() {
  return (
    <div className="flex flex-col gap-y-4 p-3 sm:p-4 md:p-5">
      <FormCreateRentalContract />
    </div>
  );
}
