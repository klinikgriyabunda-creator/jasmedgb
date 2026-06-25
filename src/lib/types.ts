export type Role = "owner" | "bidan";

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string; // = email
  password: string; // hidden (placeholder "•••" for legacy UI)
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
  tanggal: string;
  bidanIds: string[];
  bidanNamas: string[];
  pasien: string;
  tarifId: string;
  tarifNama: string;
  tarifNominal: number;
  jumlah: number;
  subtotal: number;
  createdAt: string;
}

export interface TarifPending {
  id: string;
  nama: string;
  kategori: string;
  tarif: number;
  bidanId: string | null;
  bidanNama: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
