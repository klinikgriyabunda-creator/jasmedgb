export type Role = "owner" | "bidan";

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  password: string;
  email?: string;
}

export interface Tarif {
  id: string;
  nama: string;
  kategori: string;
  tarif: number; // 0 berarti belum diisi owner
}

export interface Transaksi {
  id: string;
  tanggal: string; // ISO date yyyy-mm-dd
  bidanIds: string[]; // 1 atau 2 bidan
  bidanNamas: string[];
  pasien: string;
  tarifId: string;
  tarifNama: string;
  tarifNominal: number; // owner-controlled; 0 jika belum diisi
  jumlah: number;
  subtotal: number; // tarifNominal * jumlah
  createdAt: string;
}
