export type FieldType =
  | "number"
  | "boolean"
  | "single-select"
  | "multi-select"
  | "text"
  | "date"
  | "time";

export interface CriteriaField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  show_when?: {
    key: string;
    // An array matches any listed value, e.g. video-only or photo + video.
    value: string | number | boolean | (string | number | boolean)[];
  };
  comparison?: "gte" | "lte" | "eq";
  user_mode?: "admin" | "user";
  group: "basic" | "optional";
}

export const isCriteriaVisible = (
  field: CriteriaField,
  values: Record<string, unknown>,
  fields: CriteriaField[] = [],
  userRole?: string,
  visited = new Set<string>(),
): boolean => {
  if (userRole && field.user_mode && field.user_mode !== userRole) return false;
  if (!field.show_when) return true;
  if (visited.has(field.key)) return false;
  const seen = new Set(visited).add(field.key);
  const { key, value } = field.show_when;
  const parent = fields.find((candidate) => candidate.key === key);
  if (parent && !isCriteriaVisible(parent, values, fields, userRole, seen))
    return false;
  const actual = values[key];
  const expected = Array.isArray(value) ? value : [value];
  return expected.some((option) =>
    Array.isArray(actual) ? actual.includes(option) : actual === option,
  );
};

export const hasCriteriaValue = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  (!Array.isArray(value) || value.length > 0);

export const clearHiddenCriteria = (
  fields: CriteriaField[],
  values: Record<string, unknown>,
): Record<string, unknown> => {
  const result = Object.fromEntries(
    Object.entries(values).filter(([key]) => {
      const field = fields.find((candidate) => candidate.key === key);
      return !field || isCriteriaVisible(field, values, fields);
    }),
  );
  return result;
};

export const booleanField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "boolean",
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const quantityField = (
  key: string,
  label: string,
  unit: string,
  limits: Pick<CriteriaField, "min" | "max" | "step" | "comparison"> = {},
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "number",
  unit,
  min: 0,
  comparison: "gte",
  ...limits,
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const singleSelectField = (
  key: string,
  label: string,
  options: string[],
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "single-select",
  options,
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const multiSelectField = (
  key: string,
  label: string,
  options: string[],
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "multi-select",
  options,
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const textField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "text",
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const dateField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "date",
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

export const timeField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
  importance: "basic" | "optional" = "optional",
): CriteriaField => ({
  key,
  label,
  type: "time",
  group: importance,
  show_when: showWhen,
  user_mode: userMode,
});

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

export const CRITERIA_PRIORITY_OPTIONS = ["must-have", "preferred"] as const;
export type CriteriaPriority = (typeof CRITERIA_PRIORITY_OPTIONS)[number];

// Controls the display group only; users choose required matching via Must have.
const basicField = (field: CriteriaField): CriteriaField => ({
  ...field,
  group: "basic",
});

export const SHARED_CRITERIA: CriteriaField[] = [
  booleanField("instalments_available", "Bayaran Ansuran Tersedia"),
];

export const SERVICE_CRITERIA: Record<number, CriteriaField[]> = {
  [SERVICE_ID.VENUE]: [
    basicField(
      singleSelectField("venue_type", "Jenis Venue", [
        "Dewan",
        "Rumah",
        "Hotel Ballroom",
        "Dewan MPKK / JKKK",
        "Resort",
      ]),
    ),
    basicField(
      quantityField("seated_capacity", "Kapasiti Duduk Serentak (Pax)", "pax"),
    ),
    basicField(
      singleSelectField("venue_setting", "Ruang Majlis", [
        "Indoor",
        "Outdoor",
        "Hybrid",
      ]),
    ),
    basicField(
      singleSelectField("rental_basis", "Tempoh Sewaan", [
        "Sehari",
        "Sesi Pagi",
        "Sesi Petang",
        "Sesi Malam",
      ]),
    ),
    booleanField("provides_khemah", "Khemah Disediakan"),
    multiSelectField(
      "khemah_types",
      "Jenis Khemah",
      ["Kayu", "Canopy", "Dome", "VIP / Pearl", "Arabian"],
      { key: "provides_khemah", value: true },
    ),
    booleanField("air_conditioned", "Berhawa Dingin"),
    booleanField("parking_available", "Tempat Letak Kereta"),
    booleanField("includes_tables_chairs", "Termasuk Meja dan Kerusi"),
    booleanField("prayer_facilities", "Surau / Ruang Solat"),
    multiSelectField("accessibility", "Kemudahan Akses", [
      "Pintu Masuk Tanpa Tangga",
      "Lif",
      "Tandas Mesra OKU",
    ]),
    booleanField("rain_backup", "Ruang Alternatif Berbumbung Jika Hujan", {
      key: "venue_setting",
      value: ["Outdoor", "Hybrid"],
    }),
    multiSelectField("external_vendors_allowed", "Vendor Luar Dibenarkan", [
      "Katering",
      "Pelamin",
      "Sistem Audio",
    ]),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PELAMIN]: [
    basicField(
      singleSelectField("style", "Gaya Pelamin", [
        "Moden",
        "Tradisional",
        "Minimalis",
        "Rustic",
        "All White",
        "Floral",
        "Arabic / Islamic",
      ]),
    ),
    basicField(
      singleSelectField("pelamin_size", "Saiz Pelamin", [
        "Mini / Nikah",
        "Penuh / Resepsi",
      ]),
    ),
    basicField(
      multiSelectField("setup_compatibility", "Kesesuaian Lokasi", [
        "Indoor",
        "Khemah",
        "Outdoor",
      ]),
    ),
    booleanField("includes_backdrop", "Termasuk Backdrop"),
    multiSelectField(
      "backdrop_type",
      "Jenis Backdrop",
      ["Kain", "Dinding Bunga", "Skrin LED", "Panel Kayu"],
      { key: "includes_backdrop", value: true },
    ),
    singleSelectField("flower_type", "Jenis Bunga", [
      "Segar",
      "Tiruan",
      "Campuran",
    ]),
    booleanField("colour_customization", "Warna Boleh Diubah"),
    booleanField("includes_stage", "Termasuk Pentas / Platform"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CATERING]: [
    basicField(
      singleSelectField("service_style", "Gaya Hidangan", [
        "Buffet",
        "Hidang",
        "Live Station",
      ]),
    ),
    basicField(
      multiSelectField("cuisine_style", "Jenis Masakan", [
        "Melayu Tradisional",
        "Fusion",
        "Western",
        "International",
      ]),
    ),
    basicField(quantityField("dish_count", "Bilangan Hidangan", "dishes")),
    basicField(
      multiSelectField("rice_options", "Pilihan Nasi", [
        "Nasi Minyak",
        "Nasi Putih",
        "Nasi Beriani",
        "Nasi Tomato",
      ]),
    ),
    singleSelectField("tableware", "Pinggan Mangkuk", [
      "Seramik / Boleh Guna Semula",
      "Pakai Buang",
      "Tidak Termasuk",
    ]),
    booleanField("menu_tasting", "Sesi Merasa Menu Tersedia"),
    booleanField("includes_serving_staff", "Termasuk Kakitangan Hidangan"),
    booleanField("includes_drinks", "Termasuk Minuman"),
    booleanField("includes_dessert", "Termasuk Pencuci Mulut / Kuih"),
    booleanField(
      "includes_meja_beradab",
      "Termasuk Meja Beradab / Hidangan Pengantin",
    ),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PHOTOGRAPHER]: [
    basicField(
      singleSelectField("coverage_type", "Jenis Liputan", [
        "Photo Only",
        "Video Only",
        "Photo + Video",
      ]),
    ),
    basicField(
      singleSelectField("event_coverage", "Liputan Majlis", [
        "Akad Sahaja",
        "Sehari Penuh",
        "Berbilang Hari",
      ]),
    ),
    basicField(
      multiSelectField("deliverables", "Hasil Diserahkan", [
        "Foto Disunting",
        "Album",
        "Video Sinematik",
        "Same-Day Edit",
        "Rakaman Penuh Majlis",
      ]),
    ),
    multiSelectField("photography_style", "Gaya Rakaman", [
      "Tradisional",
      "Candid / Dokumentari",
      "Sinematik",
    ]),
    basicField(
      quantityField("coverage_hours", "Tempoh Liputan (Jam)", "hours"),
    ),
    quantityField("photographer_count", "Bilangan Jurugambar", "people"),
    quantityField(
      "videographer_count",
      "Bilangan Juruvideo",
      "people",
      {},
      { key: "coverage_type", value: ["Video Only", "Photo + Video"] },
    ),
    booleanField("has_drone", "Drone Shot"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CLOTHING]: [
    basicField(
      singleSelectField("clothing_type", "Jenis Pakaian", [
        "Sewa",
        "Tempah Jahit",
        "Ready-Made",
      ]),
    ),
    basicField(
      singleSelectField("gender", "Untuk", ["Lelaki", "Perempuan", "Pasangan"]),
    ),
    basicField(
      multiSelectField("attire_type", "Jenis Busana", [
        "Baju Melayu",
        "Baju Kurung",
        "Songket",
        "Gown Moden",
        "Baju Akad",
        "Baju Sanding",
      ]),
    ),
    basicField(
      multiSelectField("available_sizes", "Saiz Tersedia", [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "2XL",
        "3XL",
        "4XL",
        "Tempahan Ukuran",
      ]),
    ),
    quantityField("outfit_changes", "Bilangan Persalinan", "outfits"),
    booleanField("colour_customization", "Warna Boleh Diubah"),
    multiSelectField("included_accessories", "Aksesori Termasuk", [
      "Songkok",
      "Samping",
      "Tudung / Hijab",
      "Barang Kemas",
    ]),
    booleanField("includes_alterations", "Termasuk Ubah Suai Ukuran"),
    basicField(
      quantityField(
        "tailoring_lead_days",
        "Tempoh Jahitan (Hari)",
        "days",
        { comparison: "lte" },
        { key: "clothing_type", value: "Tempah Jahit" },
      ),
    ),
    basicField(
      quantityField(
        "rental_days",
        "Tempoh Sewaan (Hari)",
        "days",
        {},
        { key: "clothing_type", value: "Sewa" },
      ),
    ),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.MUA]: [
    basicField(
      multiSelectField("service_scope", "Skop Servis", [
        "Solekan Nikah",
        "Solekan Sanding",
        "Touch Up",
        "Keluarga / Pengiring",
      ]),
    ),
    multiSelectField("makeup_style", "Gaya Solekan", [
      "Soft / Natural",
      "Glam",
      "Tradisional",
    ]),
    basicField(
      quantityField("pax_covered", "Bilangan Orang Diliputi", "people"),
    ),
    booleanField("includes_hijab_styling", "Termasuk Gaya Hijab"),
    booleanField("includes_hairdo", "Termasuk Dandanan Rambut / Sanggul"),
    booleanField("includes_trial", "Termasuk Sesi Percubaan"),
    booleanField(
      "product_allergy_accommodations",
      "Penyesuaian Produk untuk Alahan",
    ),
    basicField(
      multiSelectField("service_location", "Lokasi Servis", [
        "Di Lokasi Pelanggan",
        "Studio",
      ]),
    ),
    quantityField(
      "touch_up_hours",
      "Tempoh Touch Up (Jam)",
      "hours",
      {},
      { key: "service_scope", value: "Touch Up" },
    ),
    ...SHARED_CRITERIA,
  ],
};
