/**
 * Mazda USA consumer vehicle lines as shown on mazdausa.com (trim/year availability may vary).
 * Last aligned with mazdausa.com lineup - April 2026.
 */
export type MazdaModelOption = {
  id: string;
  label: string;
};

export type MazdaTrimOption = {
  id: string;
  label: string;
};

export const MAZDA_MODEL_OPTIONS: readonly MazdaModelOption[] = [
  { id: "mazda3-sedan", label: "Mazda3 Sedan" },
  { id: "mazda3-hatchback", label: "Mazda3 Hatchback" },
  { id: "mx-5-miata", label: "Mazda MX-5 Miata" },
  { id: "mx-5-miata-rf", label: "Mazda MX-5 Miata RF" },
  { id: "cx-30", label: "Mazda CX-30" },
  { id: "cx-5", label: "Mazda CX-5" },
  { id: "cx-50", label: "Mazda CX-50" },
  { id: "cx-50-hybrid", label: "Mazda CX-50 Hybrid" },
  { id: "cx-70", label: "Mazda CX-70" },
  { id: "cx-70-phev", label: "Mazda CX-70 Plug-in Hybrid" },
  { id: "cx-90", label: "Mazda CX-90" },
  { id: "cx-90-phev", label: "Mazda CX-90 Plug-in Hybrid" },
];

export const MAZDA_TRIMS_BY_MODEL: Readonly<Record<string, readonly MazdaTrimOption[]>> = {
  "mazda3-sedan": [
    { id: "mazda3-sedan-2-5-s", label: "2.5 S" },
    { id: "mazda3-sedan-2-5-select-sport", label: "2.5 Select Sport" },
    { id: "mazda3-sedan-2-5-preferred", label: "2.5 Preferred" },
    { id: "mazda3-sedan-2-5-carbon-edition", label: "2.5 Carbon Edition" },
    { id: "mazda3-sedan-2-5-premium", label: "2.5 Premium" },
    { id: "mazda3-sedan-2-5-turbo-premium-plus", label: "2.5 Turbo Premium Plus" },
  ],
  "mazda3-hatchback": [
    { id: "mazda3-hatchback-2-5-s", label: "2.5 S" },
    { id: "mazda3-hatchback-2-5-select-sport", label: "2.5 Select Sport" },
    { id: "mazda3-hatchback-2-5-preferred", label: "2.5 Preferred" },
    { id: "mazda3-hatchback-2-5-carbon-edition", label: "2.5 Carbon Edition" },
    { id: "mazda3-hatchback-2-5-premium", label: "2.5 Premium" },
    { id: "mazda3-hatchback-2-5-turbo-premium-plus", label: "2.5 Turbo Premium Plus" },
  ],
  "mx-5-miata": [
    { id: "mx-5-miata-sport", label: "Sport" },
    { id: "mx-5-miata-club", label: "Club" },
    { id: "mx-5-miata-grand-touring", label: "Grand Touring" },
  ],
  "mx-5-miata-rf": [
    { id: "mx-5-miata-rf-club", label: "Club" },
    { id: "mx-5-miata-rf-grand-touring", label: "Grand Touring" },
  ],
  "cx-30": [
    { id: "cx-30-2-5-s", label: "2.5 S" },
    { id: "cx-30-select-sport", label: "Select Sport" },
    { id: "cx-30-preferred", label: "Preferred" },
    { id: "cx-30-carbon-edition", label: "Carbon Edition" },
    { id: "cx-30-premium", label: "Premium" },
    { id: "cx-30-carbon-turbo", label: "Carbon Turbo" },
    { id: "cx-30-turbo-premium", label: "Turbo Premium" },
    { id: "cx-30-turbo-premium-plus", label: "Turbo Premium Plus" },
  ],
  "cx-5": [
    { id: "cx-5-2-5-s", label: "2.5 S" },
    { id: "cx-5-select", label: "Select" },
    { id: "cx-5-preferred", label: "Preferred" },
    { id: "cx-5-carbon-edition", label: "Carbon Edition" },
    { id: "cx-5-premium-plus", label: "Premium Plus" },
    { id: "cx-5-carbon-turbo", label: "Carbon Turbo" },
    { id: "cx-5-turbo-signature", label: "Turbo Signature" },
  ],
  "cx-50": [
    { id: "cx-50-2-5-s-select", label: "2.5 S Select" },
    { id: "cx-50-2-5-s-preferred", label: "2.5 S Preferred" },
    { id: "cx-50-2-5-s-premium", label: "2.5 S Premium" },
    { id: "cx-50-2-5-turbo-meridian", label: "2.5 Turbo Meridian Edition" },
    { id: "cx-50-2-5-turbo-premium", label: "2.5 Turbo Premium" },
    { id: "cx-50-2-5-turbo-premium-plus", label: "2.5 Turbo Premium Plus" },
  ],
  "cx-50-hybrid": [
    { id: "cx-50-hybrid-preferred", label: "Hybrid Preferred" },
    { id: "cx-50-hybrid-premium", label: "Hybrid Premium" },
    { id: "cx-50-hybrid-premium-plus", label: "Hybrid Premium Plus" },
  ],
  "cx-70": [
    { id: "cx-70-preferred", label: "Preferred" },
    { id: "cx-70-preferred-plus", label: "Preferred Plus" },
    { id: "cx-70-premium", label: "Premium" },
    { id: "cx-70-premium-plus", label: "Premium Plus" },
    { id: "cx-70-turbo-s-premium", label: "Turbo S Premium" },
    { id: "cx-70-turbo-s-premium-plus", label: "Turbo S Premium Plus" },
  ],
  "cx-70-phev": [
    { id: "cx-70-phev-preferred", label: "PHEV Preferred" },
    { id: "cx-70-phev-premium", label: "PHEV Premium" },
    { id: "cx-70-phev-premium-plus", label: "PHEV Premium Plus" },
  ],
  "cx-90": [
    { id: "cx-90-preferred", label: "Preferred" },
    { id: "cx-90-preferred-plus", label: "Preferred Plus" },
    { id: "cx-90-premium-sport", label: "Premium Sport" },
    { id: "cx-90-premium-plus", label: "Premium Plus" },
    { id: "cx-90-turbo-s-premium", label: "Turbo S Premium" },
    { id: "cx-90-turbo-s-premium-plus", label: "Turbo S Premium Plus" },
  ],
  "cx-90-phev": [
    { id: "cx-90-phev-preferred", label: "PHEV Preferred" },
    { id: "cx-90-phev-premium-sport", label: "PHEV Premium Sport" },
    { id: "cx-90-phev-premium-plus", label: "PHEV Premium Plus" },
  ],
};

export function getMazdaModelById(id: string): MazdaModelOption | undefined {
  return MAZDA_MODEL_OPTIONS.find((m) => m.id === id);
}

export function getTrimsForMazdaModel(modelId: string): readonly MazdaTrimOption[] {
  return MAZDA_TRIMS_BY_MODEL[modelId] ?? [];
}

export function getMazdaTrimById(modelId: string, trimId: string): MazdaTrimOption | undefined {
  return getTrimsForMazdaModel(modelId).find((t) => t.id === trimId);
}
