import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Tarif, Transaksi, User } from "./types";
import { SEED_TARIF, SEED_USERS } from "./seed";

interface JasmedState {
  currentUser: User | null;
  users: User[];
  tarif: Tarif[];
  transaksi: Transaksi[];
  login: (user: User) => void;
  logout: () => void;
  addBidan: (data: { name: string; username: string; password: string }) => void;
  updateBidan: (
    id: string,
    data: { name: string; username: string; password: string },
  ) => void;
  deleteBidan: (id: string) => void;
  addTarif: (t: Omit<Tarif, "id">) => void;
  updateTarif: (id: string, t: Omit<Tarif, "id">) => void;
  deleteTarif: (id: string) => void;
  addTransaksi: (t: Omit<Transaksi, "id" | "createdAt">) => void;
  updateTransaksi: (
    id: string,
    t: Omit<Transaksi, "id" | "createdAt">,
  ) => void;
  deleteTransaksi: (id: string) => void;
}

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const useStore = create<JasmedState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: SEED_USERS,
      tarif: SEED_TARIF,
      transaksi: [],
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
      addBidan: ({ name, username, password }) =>
        set((s) => {
          const id = slug(name) || `bidan-${Date.now()}`;
          return {
            users: [
              ...s.users,
              {
                id,
                name: name.startsWith("Bidan") ? name : `Bidan ${name}`,
                role: "bidan",
                username,
                password,
              },
            ],
          };
        }),
      updateBidan: (id, { name, username, password }) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  name: name.startsWith("Bidan") ? name : `Bidan ${name}`,
                  username,
                  password,
                }
              : u,
          ),
        })),
      deleteBidan: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
      addTarif: (t) =>
        set((s) => ({
          tarif: [...s.tarif, { ...t, id: crypto.randomUUID() }],
        })),
      updateTarif: (id, t) =>
        set((s) => ({
          tarif: s.tarif.map((x) => (x.id === id ? { ...t, id } : x)),
        })),
      deleteTarif: (id) =>
        set((s) => ({ tarif: s.tarif.filter((x) => x.id !== id) })),
      addTransaksi: (t) =>
        set((s) => ({
          transaksi: [
            {
              ...t,
              subtotal: t.tarifNominal * t.jumlah,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...s.transaksi,
          ],
        })),
      updateTransaksi: (id, t) =>
        set((s) => ({
          transaksi: s.transaksi.map((x) =>
            x.id === id
              ? {
                  ...x,
                  ...t,
                  subtotal: t.tarifNominal * t.jumlah,
                }
              : x,
          ),
        })),
      deleteTransaksi: (id) =>
        set((s) => ({ transaksi: s.transaksi.filter((x) => x.id !== id) })),
    }),
    {
      name: "jasmed-store",
      version: 2,
      migrate: () => ({
        currentUser: null,
        users: SEED_USERS,
        tarif: SEED_TARIF,
        transaksi: [],
      }),
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return window.localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 0,
        } as Storage;
      }),
    },
  ),
);
