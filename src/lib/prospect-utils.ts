import type { ProspectRecord } from "@/lib/prospect-types";

export function isLegacyProspect(p: ProspectRecord): boolean {
  return (
    p.vehicles.length === 1 && p.vehicles[0].mazdaModelId === "legacy"
  );
}
