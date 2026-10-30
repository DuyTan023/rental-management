
import { ContractDetail } from "@/lib/components/landlord/rental_contracts/ContractDetail.tsx";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContractDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <div className="p-4 md:p-6">
      <ContractDetail contractId={id} />
    </div>
  );
}
