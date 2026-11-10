export type AssetCondition =
  | "GOOD"
  | "DAMAGED"
  | "UNDER_REPAIR"
  | "BROKEN";

export type IncidentPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type IncidentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type TenantAsset = {
  id: string;
  room_id: string;
  name: string;
  description: string | null;
  quantity: number;
  condition: AssetCondition;
  purchase_date: string | null;
  unit_price: string | number | null;
  image_url: string | null;
  note: string | null;
  is_active: boolean;
};

export type TenantAssetsResponse = {
  room: {
    id: string;
    room_number: string;
  };
  contract: {
    id: string;
    contract_number: string;
  };
  assets: TenantAsset[];
};

export type IncidentUpdate = {
  id: string;
  old_status: IncidentStatus | null;
  new_status: IncidentStatus;
  note: string | null;
  image_urls: string[];
  created_at: string;
  users?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
};

export type TenantIncident = {
  id: string;
  asset_id: string | null;
  room_id: string;
  contract_id: string;
  reported_by: string;
  title: string;
  description: string;
  image_urls: string[];
  priority: IncidentPriority;
  status: IncidentStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;

  room_assets?: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;

  rooms?: {
    id: string;
    room_number: string;
  };

  rental_contracts?: {
    id: string;
    contract_number: string;
    status: string;
  };

  asset_incident_updates?: IncidentUpdate[];
};

export type IncidentPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TenantIncidentListResponse = {
  items: TenantIncident[];
  pagination: IncidentPagination;
};