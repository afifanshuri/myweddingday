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
        "Hall/Event Space",
        "House / Villa",
        "Hotel Ballroom",
        "Dewan Serbaguna/Komuniti",
        "Resort",
      ]),
    ),
    basicField(
      singleSelectField("venue_setting", "Ruang Seating", [
        "Indoor",
        "Outdoor",
        "Kedua-duanya (Hybrid)",
      ]),
    ),
    basicField(
      quantityField(
        "seated_capacity",
        "Kapasiti Duduk Serentak (Pax)",
        "hours",
      ),
    ),
    basicField(quantityField("rent_hours", "Tempoh Sewaan (Jam)", "pax")),
    basicField(booleanField("decor_available", "Dekorasi Disediakan")),
    basicField(booleanField("is_all_in_package", "Pakej All-Inclusive")),
    booleanField("provides_khemah", "Khemah Disediakan"),
    multiSelectField(
      "khemah_types",
      "Jenis Khemah",
      ["Kayu", "Canopy", "Dome", "VIP / Pearl", "Arabian"],
      { key: "provides_khemah", value: true },
    ),
    booleanField("air_conditioned", "Berhawa Dingin"),
    booleanField("includes_tables_chairs", "Termasuk Meja dan Kerusi"),
    booleanField("prayer_facilities", "Surau / Ruang Solat"),
    multiSelectField("accessibility", "Kemudahan Akses", [
      "Parking Kereta",
      "Laluan/Tangga OKU",
      "Lif",
      "Tandas Mesra OKU",
    ]),
    multiSelectField(
      "external_vendors_allowed",
      "Vendor Luar Dibenarkan",
      ["Katering", "Pelamin", "Sistem Audio", "Vendor Makanan / Minuman"],
      { key: "is_all_in_package", value: false },
    ),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PELAMIN]: [
    basicField(
      multiSelectField("style", "Gaya Pelamin", [
        "Modern",
        "Klasik",
        "Minimalis",
        "All White",
        "Floral",
        "Arabic / Islamic",
        "Grand / Royal",
        "Lain-lain",
      ]),
    ),
    basicField(
      multiSelectField("pelamin_size", "Saiz Pelamin", [
        "Mini (4-6ft)",
        "Standard (6-8ft)",
        "Large (10-12ft)",
        "Extra Large (16-20ft)",
      ]),
    ),
    basicField(
      multiSelectField("setup_compatibility", "Lokasi Pelamin", [
        "Indoor",
        "Khemah",
        "Outdoor",
      ]),
    ),
    booleanField("backdrop_available", "Backdrop Tersedia"),
    booleanField("arch_available", "Arch Tersedia"),
    multiSelectField(
      "backdrop_type",
      "Jenis Backdrop",
      ["Kain", "Bunga", "Skrin LED", "Panel Kayu", "Fleksibel"],
      { key: "backdrop_available", value: true },
    ),
    booleanField("includes_stage", "Termasuk Stage"),
    booleanField("includes_lighting", "Termasuk Lighting"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CATERING]: [
    basicField(
      quantityField("dish_count", "Bilangan Pax Untuk Dihidangkan", "pax"),
    ),
    basicField(
      singleSelectField("flexible_menu", "Pilih Menu", [
        "Saya Mahu Pilih Menu",
        "Saya fleksibel dengan pakej yang disediakan oleh vendor",
      ]),
    ),
    basicField(
      multiSelectField(
        "rice_options",
        "Pilihan Nasi",
        [
          "Nasi Minyak",
          "Nasi Putih",
          "Nasi Beriani",
          "Nasi Tomato",
          "Nasi Hujan Panas",
        ],
        { key: "flexible_menu", value: "Saya Mahu Pilih Menu" },
      ),
    ),
    basicField(
      multiSelectField(
        "lauk_options",
        "Pilihan Menu",
        [
          "Ayam",
          "Daging",
          "Kambing",
          "Ikan",
          "Udang",
          "Sayur-sayuran",
          "Buah-buahan",
          "Papadom",
        ],
        { key: "flexible_menu", value: "Saya Mahu Pilih Menu" },
      ),
    ),
    basicField(
      multiSelectField(
        "drink_cold_options",
        "Pilihan Minuman Sejuk",
        ["Punch", "Sirap", "Oren", "Sejuk", "Teh O Ais"],
        { key: "flexible_menu", value: "Saya Mahu Pilih Menu" },
      ),
    ),
    basicField(
      multiSelectField(
        "drink_hot_options",
        "Pilihan Minuman Panas",
        ["Teh Tarik", "Kopi", "Teh O"],
        { key: "flexible_menu", value: "Saya Mahu Pilih Menu" },
      ),
    ),
    basicField(
      booleanField("includes_dessert", "Termasuk Kuih / Pencuci Mulut", {
        key: "flexible_menu",
        value: "Saya Mahu Pilih Menu",
      }),
    ),
    singleSelectField("tableware", "Pilihan Tableware", [
      "Tableware Seramik / Kaca",
      "Tableware Pakai Buang",
      "Tidak Termasuk",
    ]),
    booleanField("includes_serving_staff", "Termasuk Pramusaji / Staf Hidang"),
    booleanField("includes_makan_beradab", "Termasuk Hidangan Makan Beradab"),
    booleanField("includes_vip", "Termasuk Hidangan VIP"),
    booleanField("includes_table_decor", "Termasuk Hiasan Meja"),
    booleanField("menu_tasting", "Tasting Session Tersedia"),

    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PHOTOGRAPHER]: [
    basicField(
      singleSelectField("coverage_type", "Jenis Coverage", [
        "Photo Only",
        "Video Only",
        "Photo + Video",
      ]),
    ),
    basicField(
      multiSelectField("event_coverage", "Coverage Majlis", [
        "Pre Wedding / Engagement",
        "Akad Nikah",
        "Sanding / Resepsi",
        "Akad Nikah + Sanding / Resepsi",
        "Outdoor",
      ]),
    ),
    singleSelectField(
      "different_day_outdoor",
      "Coverage Outdoor",
      ["Hari Sama", "Hari Berbeza"],
      {
        key: "event_coverage",
        value: "Outdoor",
      },
    ),
    multiSelectField("deliverables", "Add Ons", [
      "Album Foto",
      "Gambar Berserta Frame",
      "Edit Hari Yang Sama",
      "Rakaman Drone",
      "Rakaman Penuh Majlis",
    ]),
    basicField(
      quantityField("coverage_hours", "Tempoh Coverage (Jam)", "hours"),
    ),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CLOTHING]: [
    basicField(
      singleSelectField("clothing_type", "Jenis Pakaian", [
        "Sewa",
        "Bespoke / Tempah Jahit",
        "Ready-Made",
      ]),
    ),

    basicField(
      quantityField(
        "rental_days",
        "Tempoh Sewaan (Hari)",
        "days",
        {},
        { key: "clothing_type", value: "Sewa" },
        "user",
      ),
    ),
    basicField(
      quantityField(
        "rental_days_min",
        "Tempoh Sewaan (Hari) Minimum",
        "days",
        {},
        { key: "clothing_type", value: "Sewa" },
        "admin",
      ),
    ),
    basicField(
      singleSelectField("gender_clothing", "Untuk", [
        "Lelaki",
        "Perempuan",
        "Pasangan",
      ]),
    ),
    basicField(
      multiSelectField("attire_type", "Jenis Pakaian", [
        "Baju Melayu",
        "Baju Songket",
        "Baju Kurung",
        "Baju Kebaya",
        "Wedding Dress",
        "Suit / Tuxedo",
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
    quantityField("outfit_changes", "Bilangan Sesi Fitting", "sessions"),
    multiSelectField("included_accessories", "Aksesori", [
      "Songkok",
      "Sampin",
      "Tudung / Hijab",
      "Barang Kemas",
      "Crown",
      "Veil",
      "Bunga Tangan",
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
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.MUA]: [
    basicField(
      multiSelectField("service_scope", "Skop Servis", [
        "Solekan Basic",
        "Solekan Tunang",
        "Solekan Nikah",
        "Solekan Sanding",
        "Touch Up",
      ]),
    ),
    basicField(
      singleSelectField("gender_mua", "Untuk", [
        "Lelaki",
        "Perempuan",
        "Pasangan",
        "Lain-lain",
      ]),
    ),
    booleanField("includes_hijab_styling", "Termasuk Hijab Styling"),
    booleanField("includes_hairdo", "Termasuk Dandanan Rambut / Sanggul"),
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
