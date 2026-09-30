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
  show_when?: { key: string; value: string | number | boolean };
  comparison?: "gte" | "lte" | "eq";
  user_mode?: "admin" | "user";
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
  return Array.isArray(actual) ? actual.includes(value as never) : actual === value;
};

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
  showWhen?: { key: string; value: string | number | boolean },
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "boolean",
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
): CriteriaField => ({
  key,
  label,
  type: "number",
  unit,
  min: 0,
  comparison: "gte",
  ...limits,
  show_when: showWhen,
  user_mode: userMode,
});

export const singleSelectField = (
  key: string,
  label: string,
  options: string[],
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "single-select",
  options,
  show_when: showWhen,
  user_mode: userMode,
});

export const multiSelectField = (
  key: string,
  label: string,
  options: string[],
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "multi-select",
  options,
  show_when: showWhen,
  user_mode: userMode,
});

export const textField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "text",
  show_when: showWhen,
  user_mode: userMode,
});

export const dateField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "date",
  show_when: showWhen,
  user_mode: userMode,
});

export const timeField = (
  key: string,
  label: string,
  showWhen?: CriteriaField["show_when"],
  userMode?: "admin" | "user",
): CriteriaField => ({
  key,
  label,
  type: "time",
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

export const SHARED_CRITERIA: CriteriaField[] = [
  singleSelectField("deposit_type", "Jenis Deposit", ["Tiada", "Amaun Tetap", "Peratus"], undefined, "user"),
  quantityField("deposit_amount", "Deposit (RM)", "MYR", {}, { key: "deposit_type", value: "Amaun Tetap" }),
  quantityField("deposit_percentage", "Deposit (%)", "%", { max: 100 }, { key: "deposit_type", value: "Peratus" }),
  booleanField("instalments_available", "Bayaran Ansuran Tersedia"),
];

export const SERVICE_CRITERIA: Record<number, CriteriaField[]> = {
  [SERVICE_ID.VENUE]: [
    singleSelectField("venue_type", "Jenis Venue", ["Dewan", "Hotel", "Rumah", "Outdoor", "Khemah", "Hotel Ballroom", "Dewan MPKK / JKKK", "Resort"]),
    quantityField("seated_capacity", "Kapasiti Duduk Serentak (Pax)", "pax"),
    quantityField("total_event_capacity", "Kapasiti Tetamu Sepanjang Majlis (Pax)", "pax"),
    singleSelectField("venue_setting", "Ruang Majlis", ["Indoor", "Outdoor", "Hybrid"]),
    singleSelectField("rental_basis", "Tempoh Sewaan", ["Sehari", "Sesi Pagi", "Sesi Petang", "Sesi Malam"]),
    booleanField("provides_khemah", "Khemah Disediakan"),
    multiSelectField("khemah_types", "Jenis Khemah", ["Kayu", "Canopy", "Dome", "VIP / Pearl", "Arabian"], { key: "provides_khemah", value: true }),
    quantityField("khemah_capacity", "Kapasiti Setiap Khemah (Pax)", "pax", {}, { key: "provides_khemah", value: true }),
    quantityField("khemah_tables", "Meja Setiap Khemah", "tables", {}, { key: "provides_khemah", value: true }),
    booleanField("includes_khemah_scallop", "Termasuk Scallop Khemah", { key: "provides_khemah", value: true }),
    booleanField("includes_khemah_fans", "Termasuk Kipas Khemah", { key: "provides_khemah", value: true }),
    booleanField("includes_khemah_lighting", "Termasuk Lampu Khemah", { key: "provides_khemah", value: true }),
    booleanField("includes_khemah_sidewalls", "Termasuk Dinding Sisi Khemah", { key: "provides_khemah", value: true }),
    booleanField("includes_khemah_power", "Termasuk Bekalan Elektrik Khemah", { key: "provides_khemah", value: true }),
    booleanField("air_conditioned", "Berhawa Dingin"),
    booleanField("parking_available", "Tempat Letak Kereta"),
    booleanField("includes_tables_chairs", "Termasuk Meja dan Kerusi"),
    booleanField("prayer_facilities", "Surau / Ruang Solat"),
    multiSelectField("accessibility", "Kemudahan Akses", ["Pintu Masuk Tanpa Tangga", "Lif", "Tandas Mesra OKU"]),
    booleanField("bridal_room", "Bilik Persiapan Pengantin"),
    booleanField("rain_backup", "Ruang Alternatif Berbumbung Jika Hujan"),
    booleanField("includes_pa_system", "Termasuk Sistem PA"),
    booleanField("includes_microphone", "Termasuk Mikrofon"),
    booleanField("includes_cleaning", "Termasuk Pembersihan"),
    multiSelectField("external_vendors_allowed", "Vendor Luar Dibenarkan", ["Katering", "Pelamin", "Sistem Audio"]),
    quantityField("setup_access_hours", "Akses Persiapan Sebelum Sesi (Jam)", "hours"),
    quantityField("teardown_access_hours", "Akses Mengemas Selepas Sesi (Jam)", "hours"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PELAMIN]: [
    singleSelectField("style", "Gaya Pelamin", ["Moden", "Tradisional", "Minimalis", "Rustic", "All White", "Floral", "Arabic / Islamic"]),
    singleSelectField("pelamin_size", "Saiz Pelamin", ["Mini / Nikah", "Penuh / Resepsi"]),
    multiSelectField("bridal_chairs", "Kerusi Pengantin", ["Takhta Tunggal", "Takhta Berganda"]),
    multiSelectField("setup_compatibility", "Kesesuaian Lokasi", ["Indoor", "Khemah", "Outdoor"]),
    quantityField("required_floor_width", "Lebar Ruang Diperlukan (Meter)", "m", { comparison: "lte" }),
    quantityField("required_floor_depth", "Kedalaman Ruang Diperlukan (Meter)", "m", { comparison: "lte" }),
    quantityField("required_ceiling_height", "Ketinggian Siling Diperlukan (Meter)", "m", { comparison: "lte" }),
    booleanField("includes_backdrop", "Termasuk Backdrop"),
    multiSelectField("backdrop_type", "Jenis Backdrop", ["Kain", "Dinding Bunga", "Skrin LED", "Panel Kayu"], { key: "includes_backdrop", value: true }),
    booleanField("includes_mini_pelamin", "Termasuk Mini Pelamin"),
    multiSelectField("decor_addons", "Tambahan Dekorasi Tersedia", ["Backdrop Photobooth", "Laluan / Aisle", "Lampu Pentas"]),
    singleSelectField("flower_type", "Jenis Bunga", ["Segar", "Tiruan", "Campuran"]),
    booleanField("colour_customization", "Warna Boleh Diubah"),
    booleanField("includes_stage", "Termasuk Pentas / Platform"),
    quantityField("setup_hours", "Tempoh Pemasangan (Jam)", "hours", { comparison: "lte" }),
    quantityField("dismantling_hours", "Tempoh Pembongkaran (Jam)", "hours", { comparison: "lte" }),
    booleanField("includes_transport", "Termasuk Pengangkutan"),
    booleanField("includes_installation", "Termasuk Pemasangan"),
    booleanField("nikah_sanding_conversion", "Penukaran Pelamin Nikah ke Sanding Tersedia"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CATERING]: [
    singleSelectField("menu_type", "Jenis Menu", ["Nasi Minyak", "Nasi Beriani", "Nasi Tomato", "Buffet", "Fine Dining"]),
    multiSelectField("cuisine_style", "Jenis Masakan", ["Melayu Tradisional", "Fusion", "Western", "International"]),
    quantityField("dish_count", "Bilangan Hidangan", "dishes"),
    quantityField("serving_hours", "Tempoh Hidangan (Jam)", "hours"),
    timeField("last_refill_time", "Masa Isi Semula Terakhir"),
    quantityField("headcount_deadline_days", "Pengesahan Pax Sebelum Majlis (Hari)", "days"),
    multiSelectField("rice_options", "Pilihan Nasi", ["Nasi Minyak", "Nasi Putih", "Nasi Beriani", "Nasi Tomato"]),
    multiSelectField("lauk_options", "Pilihan Lauk", ["Ayam Masak Merah", "Daging Masak Hitam", "Ayam Goreng Berempah", "Rendang Daging"]),
    multiSelectField("drink_options", "Pilihan Minuman", ["Punch", "Sirap", "Oren", "Plain Water", "Teh Tarik (Panas)", "Teh (Sejuk)", "Kopi (Panas)"]),
    booleanField("includes_kuih", "Termasuk Kuih"),
    multiSelectField("kuih_options", "Pilihan Kuih", ["Karipap", "Kuih Lapis", "Kuih Ketayap", "Kuih Seri Muka", "Lepat Pisang"], { key: "includes_kuih", value: true }),
    singleSelectField("tableware", "Pinggan Mangkuk", ["Seramik / Boleh Guna Semula", "Pakai Buang", "Tidak Termasuk"]),
    booleanField("menu_tasting", "Sesi Merasa Menu Tersedia"),
    booleanField("includes_menu_tasting", "Sesi Merasa Menu Percuma", { key: "menu_tasting", value: true }),
    booleanField("includes_serving_staff", "Termasuk Kakitangan Hidangan"),
    quantityField("serving_staff_count", "Bilangan Kakitangan Hidangan", "people", {}, { key: "includes_serving_staff", value: true }),
    booleanField("includes_drinks", "Termasuk Minuman"),
    booleanField("includes_dessert", "Termasuk Pencuci Mulut"),
    booleanField("includes_replenishment", "Termasuk Isi Semula Hidangan"),
    booleanField("includes_meja_beradab", "Termasuk Meja Beradab / Hidangan Pengantin"),
    booleanField("includes_transport", "Termasuk Pengangkutan"),
    booleanField("includes_setup", "Termasuk Persiapan"),
    booleanField("includes_cleanup", "Termasuk Pembersihan"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.PHOTOGRAPHER]: [
    singleSelectField("coverage_type", "Jenis Liputan", ["Photo Only", "Video Only", "Photo + Video"]),
    singleSelectField("event_coverage", "Liputan Majlis", ["Akad Sahaja", "Sehari Penuh", "Berbilang Hari"]),
    multiSelectField("deliverables", "Hasil Diserahkan", ["Fail RAW", "Foto Disunting", "Album", "Video Sinematik", "Same-Day Edit"]),
    multiSelectField("photography_style", "Gaya Rakaman", ["Tradisional", "Candid / Dokumentari", "Sinematik"]),
    quantityField("coverage_hours", "Tempoh Liputan (Jam)", "hours"),
    quantityField("photographer_count", "Bilangan Jurugambar", "people"),
    quantityField("videographer_count", "Bilangan Juruvideo", "people"),
    multiSelectField("print_options", "Pilihan Cetakan", ["Album", "Cetakan Foto", "Bingkai", "Kanvas"]),
    quantityField("photo_delivery_days", "Penyerahan Foto Selepas Majlis (Hari)", "days", { comparison: "lte" }),
    quantityField("min_edited_photos", "Minimum Foto Disunting", "photos"),
    quantityField("highlight_video_minutes", "Durasi Video Sorotan (Minit)", "minutes"),
    booleanField("full_ceremony_recording", "Rakaman Penuh Majlis"),
    quantityField("full_video_minutes", "Durasi Video Penuh (Minit)", "minutes", {}, { key: "full_ceremony_recording", value: true }),
    quantityField("gallery_access_days", "Tempoh Akses Galeri (Hari)", "days"),
    quantityField("revision_rounds", "Bilangan Pusingan Semakan", "rounds"),
    booleanField("has_drone", "Drone Shot"),
    booleanField("backup_photographer", "Jurugambar Pengganti Tersedia"),
    booleanField("backup_videographer", "Juruvideo Pengganti Tersedia"),
    booleanField("private_delivery", "Penyerahan Secara Peribadi"),
    booleanField("portfolio_consent_required", "Kebenaran Sebelum Siaran Portfolio"),
    booleanField("includes_multi_location_travel", "Termasuk Perjalanan Antara Lokasi"),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.CLOTHING]: [
    singleSelectField("clothing_type", "Jenis Pakaian", ["Sewa", "Tempah Jahit", "Ready-Made"]),
    singleSelectField("gender", "Untuk", ["Lelaki", "Perempuan", "Pasangan"]),
    multiSelectField("attire_type", "Jenis Busana", ["Baju Melayu", "Baju Kurung", "Songket", "Gown Moden", "Baju Akad", "Baju Sanding"]),
    multiSelectField("available_sizes", "Saiz Tersedia", ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Tempahan Ukuran"]),
    textField("size_measurements", "Ukuran / Carta Saiz (cm)"),
    quantityField("outfit_changes", "Bilangan Persalinan", "outfits"),
    quantityField("fitting_sessions", "Bilangan Sesi Fitting", "sessions"),
    multiSelectField("sleeve_options", "Pilihan Lengan", ["Panjang", "Tiga Suku", "Pendek", "Tanpa Lengan"]),
    multiSelectField("neckline_options", "Pilihan Garis Leher", ["Leher Tinggi", "Leher Bulat", "Leher V", "Bahu Terdedah"]),
    booleanField("includes_lining", "Termasuk Lapisan Dalam"),
    multiSelectField("coverage_options", "Pilihan Litupan", ["Tidak Jarang", "Potongan Longgar", "Menutup Dada"]),
    booleanField("colour_customization", "Warna Boleh Diubah"),
    booleanField("matching_couple_sets", "Set Pasangan Sedondon"),
    multiSelectField("included_accessories", "Aksesori Termasuk", ["Songkok", "Samping", "Tudung / Hijab", "Barang Kemas"]),
    booleanField("includes_alterations", "Termasuk Ubah Suai Ukuran"),
    booleanField("includes_cleaning", "Termasuk Cucian"),
    multiSelectField("collection_options", "Pengambilan / Penghantaran", ["Ambil Sendiri", "Penghantaran Vendor", "Kurier"]),
    multiSelectField("return_options", "Pilihan Pemulangan", ["Hantar Sendiri", "Pengambilan Vendor", "Kurier"], { key: "clothing_type", value: "Sewa" }),
    quantityField("tailoring_lead_days", "Tempoh Jahitan (Hari)", "days", { comparison: "lte" }, { key: "clothing_type", value: "Tempah Jahit" }),
    quantityField("rental_days", "Tempoh Sewaan (Hari)", "days", {}, { key: "clothing_type", value: "Sewa" }),
    quantityField("return_deadline_days", "Pemulangan Selepas Majlis (Hari)", "days", {}, { key: "clothing_type", value: "Sewa" }),
    quantityField("security_deposit", "Deposit Keselamatan (RM)", "MYR", {}, { key: "clothing_type", value: "Sewa" }),
    quantityField("late_return_daily_fee", "Caj Lewat (RM/Hari)", "MYR/day", {}, { key: "clothing_type", value: "Sewa" }),
    textField("damage_charges", "Caj Kerosakan", { key: "clothing_type", value: "Sewa" }),
    ...SHARED_CRITERIA,
  ],
  [SERVICE_ID.MUA]: [
    multiSelectField("service_scope", "Skop Servis", ["Solekan Nikah", "Solekan Sanding", "Inai", "Touch Up", "Keluarga / Pengiring", "Sehari Penuh"]),
    multiSelectField("makeup_style", "Gaya Solekan", ["Soft / Natural", "Glam", "Tradisional"]),
    quantityField("pax_covered", "Bilangan Orang Diliputi", "people"),
    timeField("bride_ready_time", "Masa Pengantin Perlu Siap"),
    quantityField("preparation_minutes_per_pax", "Tempoh Persiapan Seorang (Minit)", "minutes/person", { comparison: "lte" }),
    booleanField("includes_hijab_styling", "Termasuk Gaya Hijab"),
    booleanField("includes_hairdo", "Termasuk Dandanan Rambut / Sanggul"),
    booleanField("includes_trial", "Termasuk Sesi Percubaan"),
    booleanField("includes_false_lashes", "Termasuk Bulu Mata Palsu"),
    booleanField("includes_accessory_placement", "Termasuk Pemasangan Aksesori"),
    booleanField("includes_makeup_removal_kit", "Termasuk Kit Menanggalkan Solekan"),
    singleSelectField("product_source", "Produk Solekan", ["Disediakan MUA", "Disediakan Pelanggan", "Kedua-duanya"]),
    booleanField("halal_cosmetics", "Kosmetik Bersijil Halal"),
    booleanField("sensitive_skin_consultation", "Konsultasi Kulit Sensitif"),
    booleanField("product_allergy_accommodations", "Penyesuaian Produk untuk Alahan"),
    textField("product_allergy_details", "Butiran Alahan Produk", { key: "product_allergy_accommodations", value: true }),
    multiSelectField("service_location", "Lokasi Servis", ["Di Lokasi Pelanggan", "Studio"]),
    quantityField("outstation_charge", "Caj Luar Kawasan (RM)", "MYR"),
    quantityField("early_morning_surcharge", "Caj Awal Pagi (RM)", "MYR"),
    timeField("early_morning_before", "Caj Awal Pagi Terpakai Sebelum"),
    quantityField("touch_up_hours", "Tempoh Touch Up (Jam)", "hours", {}, { key: "service_scope", value: "Touch Up" }),
    booleanField("standby_available", "Servis Standby Tersedia"),
    booleanField("backup_artist", "Jurusolek Pengganti Tersedia"),
    ...SHARED_CRITERIA,
  ],
};

