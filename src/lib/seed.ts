import type { Tarif, User } from "./types";

const BIDAN_NAMES = [
  "Fika",
  "Anita",
  "Mutiara",
  "Cici",
  "Yessi",
  "Wulan",
  "Wafa",
  "Neti",
  "Ayu",
];

export const SEED_USERS: User[] = [
  {
    id: "owner",
    name: "Owner",
    role: "owner",
    username: "owner",
    password: "admin123",
  },
  ...BIDAN_NAMES.map((n) => ({
    id: n.toLowerCase(),
    name: `Bidan ${n}`,
    role: "bidan" as const,
    username: n.toLowerCase(),
    password: "bidan123",
  })),
];

const t = (nama: string, kategori: string, tarif: number): Tarif => ({
  id: nama.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  nama,
  kategori,
  tarif,
});

export const SEED_TARIF: Tarif[] = [
  t("Anamnesa USG Pagi", "USG", 2500),
  t("Anamnesa USG Malam", "USG", 2500),
  t("Admin USG", "USG", 2500),
  t("Asisten USG 2D", "USG", 1000),
  t("Obs BJA (Bayi Baru Lahir)", "Observasi", 2000),
  t("Obs Post Partum", "Observasi", 2000),
  t("NST (Non Stress Test)", "Pemeriksaan", 1000),
  t("Pemeriksaan Dalam (PD)", "Pemeriksaan", 1500),
  t("Cek Lakmus", "Pemeriksaan", 1000),
  t("Cek Urine", "Pemeriksaan", 1000),
  t("Ambil Sampel Darah", "Pemeriksaan", 2000),
  t("Memasang Infus", "Tindakan", 2500),
  t("Memasang Oksigen Bayi", "Tindakan", 1000),
  t("Memandikan Bayi", "Perawatan", 2000),
  t("Menyeka Ibu/Bayi", "Perawatan", 2000),
  t("Memberi Terapi IV", "Terapi", 1000),
  t("Memberi Terapi Oral", "Terapi", 500),
  t("Suntik KB 1 Bulan", "KB", 1000),
  t("Ganti Plabot/Infus", "Tindakan", 1000),
  t("Aff Infus", "Tindakan", 1000),
  t("Hecting Grade 1", "Hecting", 15000),
  t("Hecting Grade 2", "Hecting", 25000),
  t("Asisten Kuret", "Persalinan", 30000),
  t("Pertolongan Persalinan", "Persalinan", 75000),
  t("Asisten Persalinan Dokter", "Persalinan", 100000),
  t("Baby Massage", "Bayi", 15000),
  t("Foto Bayi", "Bayi", 5000),
  t("Imunisasi HB0", "Bayi", 1000),
  t("Injeksi Vit K", "Bayi", 2000),
  t("Metrolisa", "Tindakan", 6000),
  t("Nebu", "Terapi", 1000),
  t("Beli Obat", "Lainnya", 500),
  t("Surat Sehat", "Lainnya", 1000),
];
