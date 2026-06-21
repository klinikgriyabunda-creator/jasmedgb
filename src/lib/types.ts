export type Role = "owner" | "bidan";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Tarif {
  id: string;
  nama: string;
  kategori: string;
  tarif: number;
}

export interface Transaksi {
  id: string;
  tanggal: string; // ISO date yyyy-mm-dd
  bidanId: string;
  bidanNama: string;
  pasien: string;
  tarifId: string;
  tarifNama: string;
  tarifNominal: number;
  jumlah: number;
  subtotal: number;
  createdAt: string;
}
