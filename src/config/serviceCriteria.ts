export type FieldType = "number" | "boolean" | "single-select" | "multi-select";

export interface CriteriaField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export const SERVICE_ID = {
  VENUE: 1,
  PELAMIN: 2,
  CATERING: 3,
  PHOTOGRAPHER: 4,
  CLOTHING: 5,
  MUA: 6,
} as const;

export const ASSET_PATH = {
  VENDOR: "assets/vendorImages",
  PACKAGE: "assets/packageImages",
};

export const SERVICE_CRITERIA: Record<number, CriteriaField[]> = {
  [SERVICE_ID.VENUE]: [
    {
      key: "venue_type",
      label: "Jenis Venue",
      type: "single-select",
      options: ["Dewan", "Hotel", "Rumah", "Outdoor", "Khemah"],
    },
    { key: "air_conditioned", label: "Berhawa Dingin", type: "boolean" },
  ],
  [SERVICE_ID.PELAMIN]: [
    {
      key: "style",
      label: "Gaya Pelamin",
      type: "single-select",
      options: [
        "Moden",
        "Tradisional",
        "Minimalis",
        "Rustic",
        "All White",
        "Floral",
      ],
    },
    { key: "includes_backdrop", label: "Termasuk Backdrop", type: "boolean" },
    {
      key: "includes_mini_pelamin",
      label: "Termasuk Mini Pelamin",
      type: "boolean",
    },
  ],
  [SERVICE_ID.CATERING]: [
    {
      key: "menu_type",
      label: "Jenis Menu",
      type: "single-select",
      options: [
        "Nasi Minyak",
        "Nasi Beriani",
        "Nasi Tomato",
        "Buffet",
        "Fine Dining",
      ],
    },
    { key: "halal_certified", label: "Sijil Halal", type: "boolean" },
    { key: "live_cooking", label: "Live Cooking Station", type: "boolean" },
  ],
  [SERVICE_ID.PHOTOGRAPHER]: [
    {
      key: "coverage_type",
      label: "Jenis Liputan",
      type: "single-select",
      options: ["Photo Only", "Video Only", "Photo + Video"],
    },
    { key: "has_drone", label: "Drone Shot", type: "boolean" },
  ],
  [SERVICE_ID.CLOTHING]: [
    {
      key: "clothing_type",
      label: "Jenis Pakaian",
      type: "single-select",
      options: ["Sewa", "Tempah Jahit", "Ready-Made"],
    },
    {
      key: "gender",
      label: "Untuk",
      type: "single-select",
      options: ["Lelaki", "Perempuan", "Pasangan"],
    },
  ],
  [SERVICE_ID.MUA]: [
    {
      key: "service_scope",
      label: "Skop Servis",
      type: "multi-select",
      options: ["Solekan Nikah", "Solekan Sanding", "Inai", "Touch Up"],
    },
  ],
};
