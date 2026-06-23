import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteUser, adminUpsertUser } from "./admin.functions";
import type { Tarif, Transaksi, User } from "./types";

interface JasmedState {
  currentUser: User | null;
  users: User[];
  tarif: Tarif[];
  transaksi: Transaksi[];
  ready: boolean;

  // internals
  _setData: (p: Partial<JasmedState>) => void;
  refresh: () => Promise<void>;

  login: (user: User) => void;
  logout: () => Promise<void>;

  addBidan: (data: { name: string; username: string; password: string }) => Promise<void>;
  updateBidan: (
    id: string,
    data: { name: string; username: string; password: string },
  ) => Promise<void>;
  deleteBidan: (id: string) => Promise<void>;
  addOwner: (data: { name: string; username: string; password: string; email?: string }) => Promise<void>;
  updateOwner: (
    id: string,
    data: { name: string; username: string; password: string; email?: string },
  ) => Promise<void>;
  deleteOwner: (id: string) => Promise<void>;

  addTarif: (t: Omit<Tarif, "id">) => Promise<Tarif>;
  updateTarif: (id: string, t: Omit<Tarif, "id">) => Promise<void>;
  deleteTarif: (id: string) => Promise<void>;

  addTransaksi: (t: Omit<Transaksi, "id" | "createdAt">) => Promise<void>;
  updateTransaksi: (id: string, t: Omit<Transaksi, "id" | "createdAt">) => Promise<void>;
  deleteTransaksi: (id: string) => Promise<void>;
}

const HIDDEN_PW = "••••••••";

function asUser(row: { id: string; nama: string; email?: string | null }, role: "owner" | "bidan"): User {
  const email = row.email ?? "";
  return {
    id: row.id,
    name: row.nama,
    role,
    username: email || row.nama,
    password: HIDDEN_PW,
    email: email || undefined,
  };
}

async function fetchAll(currentUserId: string, isOwner: boolean) {
  // profiles
  const { data: profiles } = await supabase.from("profiles").select("id, nama");
  // roles
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const roleMap = new Map<string, "owner" | "bidan">();
  (roles ?? []).forEach((r: { user_id: string; role: string }) => roleMap.set(r.user_id, r.role as "owner" | "bidan"));

  // emails: hanya owner yang bisa lihat (via admin RPC alternative — kita skip; pakai placeholder = nama)
  const users: User[] = (profiles ?? []).map((p: { id: string; nama: string }) =>
    asUser({ id: p.id, nama: p.nama }, roleMap.get(p.id) ?? "bidan"),
  );

  // tarif: owner pakai tabel asli (kolom tarif), bidan pakai view tanpa harga
  let tarif: Tarif[] = [];
  if (isOwner) {
    const { data } = await supabase.from("tarif").select("id, nama, kategori, tarif").order("nama");
    tarif = (data ?? []).map((t) => ({ id: t.id, nama: t.nama, kategori: t.kategori, tarif: Number(t.tarif) }));
  } else {
    const { data } = await supabase.from("tarif_public").select("id, nama, kategori").order("nama");
    tarif = (data ?? []).map((t) => ({
      id: t.id ?? "",
      nama: t.nama ?? "",
      kategori: t.kategori ?? "",
      tarif: 0,
    }));
  }

  // transaksi: owner pakai tabel, bidan pakai view
  let transaksi: Transaksi[] = [];
  if (isOwner) {
    const { data } = await supabase
      .from("transaksi")
      .select("id, tanggal, tarif_id, jumlah, tarif_nominal, subtotal, created_at, transaksi_bidan(bidan_id)")
      .order("created_at", { ascending: false });
    const tarifNameMap = new Map(tarif.map((t) => [t.id, t.nama]));
    const profileNameMap = new Map((profiles ?? []).map((p: { id: string; nama: string }) => [p.id, p.nama]));
    transaksi = (data ?? []).map((row) => {
      const bidanIds = (row.transaksi_bidan ?? []).map((tb: { bidan_id: string }) => tb.bidan_id);
      return {
        id: row.id,
        tanggal: row.tanggal,
        bidanIds,
        bidanNamas: bidanIds.map((id: string) => profileNameMap.get(id) ?? "—"),
        pasien: "",
        tarifId: row.tarif_id,
        tarifNama: tarifNameMap.get(row.tarif_id) ?? "—",
        tarifNominal: Number(row.tarif_nominal),
        jumlah: row.jumlah,
        subtotal: Number(row.subtotal),
        createdAt: row.created_at,
      };
    });
  } else {
    const { data } = await supabase
      .from("transaksi_public")
      .select("id, tanggal, tarif_id, jumlah, created_at, transaksi_bidan(bidan_id)")
      .order("created_at", { ascending: false });
    const tarifNameMap = new Map(tarif.map((t) => [t.id, t.nama]));
    const profileNameMap = new Map((profiles ?? []).map((p: { id: string; nama: string }) => [p.id, p.nama]));
    transaksi = (data ?? []).map((row) => {
      const bidanIds = (row.transaksi_bidan ?? []).map((tb: { bidan_id: string }) => tb.bidan_id);
      return {
        id: row.id,
        tanggal: row.tanggal,
        bidanIds,
        bidanNamas: bidanIds.map((id: string) => profileNameMap.get(id) ?? "—"),
        pasien: "",
        tarifId: row.tarif_id,
        tarifNama: tarifNameMap.get(row.tarif_id) ?? "—",
        tarifNominal: 0,
        jumlah: row.jumlah,
        subtotal: 0,
        createdAt: row.created_at,
      };
    });
  }

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;
  return { users, tarif, transaksi, currentUser, ready: true };
}

export const useStore = create<JasmedState>()((set, get) => ({
  currentUser: null,
  users: [],
  tarif: [],
  transaksi: [],
  ready: false,

  _setData: (p) => set(p),

  refresh: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ currentUser: null, users: [], tarif: [], transaksi: [], ready: true });
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isOwner = (roles ?? []).some((r) => r.role === "owner");
    const all = await fetchAll(user.id, isOwner);
    // Suntik email ke currentUser
    if (all.currentUser) all.currentUser.email = user.email ?? all.currentUser.email;
    if (all.currentUser) all.currentUser.username = user.email ?? all.currentUser.username;
    set(all);
  },

  login: (user) => set({ currentUser: user }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, users: [], tarif: [], transaksi: [], ready: true });
  },

  addBidan: async ({ name, username, password }) => {
    await adminUpsertUser({
      data: { mode: "create", email: username, password, nama: name, role: "bidan" },
    });
    await get().refresh();
  },
  updateBidan: async (id, { name, username, password }) => {
    await adminUpsertUser({
      data: {
        mode: "update",
        id,
        email: username,
        password: password && password !== HIDDEN_PW ? password : undefined,
        nama: name,
        role: "bidan",
      },
    });
    await get().refresh();
  },
  deleteBidan: async (id) => {
    await adminDeleteUser({ data: { id } });
    await get().refresh();
  },
  addOwner: async ({ name, username, password, email }) => {
    await adminUpsertUser({
      data: { mode: "create", email: email || username, password, nama: name, role: "owner" },
    });
    await get().refresh();
  },
  updateOwner: async (id, { name, username, password, email }) => {
    await adminUpsertUser({
      data: {
        mode: "update",
        id,
        email: email || username,
        password: password && password !== HIDDEN_PW ? password : undefined,
        nama: name,
        role: "owner",
      },
    });
    await get().refresh();
  },
  deleteOwner: async (id) => {
    await adminDeleteUser({ data: { id } });
    await get().refresh();
  },

  addTarif: async (t) => {
    const { data, error } = await supabase
      .from("tarif")
      .insert({ nama: t.nama, kategori: t.kategori, tarif: t.tarif })
      .select("id, nama, kategori, tarif")
      .single();
    if (error) throw error;
    const created: Tarif = {
      id: data.id,
      nama: data.nama,
      kategori: data.kategori,
      tarif: Number(data.tarif ?? 0),
    };
    set((s) => ({ tarif: [...s.tarif, created] }));
    return created;
  },
  updateTarif: async (id, t) => {
    const { error } = await supabase
      .from("tarif")
      .update({ nama: t.nama, kategori: t.kategori, tarif: t.tarif })
      .eq("id", id);
    if (error) throw error;
    await get().refresh();
  },
  deleteTarif: async (id) => {
    const { error } = await supabase.from("tarif").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ tarif: s.tarif.filter((x) => x.id !== id) }));
  },

  addTransaksi: async (t) => {
    const { data, error } = await supabase
      .from("transaksi")
      .insert({
        tanggal: t.tanggal,
        tarif_id: t.tarifId,
        jumlah: t.jumlah,
        tarif_nominal: t.tarifNominal,
      })
      .select("id")
      .single();
    if (error) throw error;
    const ids = t.bidanIds.map((bidan_id) => ({ transaksi_id: data.id, bidan_id }));
    if (ids.length) await supabase.from("transaksi_bidan").insert(ids);
    await get().refresh();
  },
  updateTransaksi: async (id, t) => {
    const { error } = await supabase
      .from("transaksi")
      .update({
        tanggal: t.tanggal,
        tarif_id: t.tarifId,
        jumlah: t.jumlah,
        tarif_nominal: t.tarifNominal,
      })
      .eq("id", id);
    if (error) throw error;
    await supabase.from("transaksi_bidan").delete().eq("transaksi_id", id);
    const ids = t.bidanIds.map((bidan_id) => ({ transaksi_id: id, bidan_id }));
    if (ids.length) await supabase.from("transaksi_bidan").insert(ids);
    await get().refresh();
  },
  deleteTransaksi: async (id) => {
    const { error } = await supabase.from("transaksi").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ transaksi: s.transaksi.filter((x) => x.id !== id) }));
  },
}));
