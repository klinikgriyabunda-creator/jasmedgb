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
  addTarif: (t: Omit<Tarif, "id">) => void;
  updateTarif: (id: string, t: Omit<Tarif, "id">) => void;
  deleteTarif: (id: string) => void;
  addTransaksi: (t: Omit<Transaksi, "id" | "createdAt">) => void;
  deleteTransaksi: (id: string) => void;
}

export const useStore = create<JasmedState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: SEED_USERS,
      tarif: SEED_TARIF,
      transaksi: [],
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
      addTarif: (t) =>
        set((s) => ({
          tarif: [
            ...s.tarif,
            { ...t, id: crypto.randomUUID() },
          ],
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
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...s.transaksi,
          ],
        })),
      deleteTransaksi: (id) =>
        set((s) => ({ transaksi: s.transaksi.filter((x) => x.id !== id) })),
    }),
    {
      name: "jasmed-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as Storage),
      ),
    },
  ),
);
