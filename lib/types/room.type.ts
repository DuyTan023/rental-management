export type TenantCurrentMeterReading = {
  meterType: "ELECTRICITY" | "WATER";
  currentValue: number;
  readingDate: string | Date;
  source: "INITIAL_HANDOVER" | "MONTHLY_REPORT";
};