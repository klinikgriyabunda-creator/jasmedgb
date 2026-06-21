import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, Users } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatTanggal, todayISO } from "@/lib/format";

export const Route = createFileRoute("/bidan/riwayat")({
  component: RiwayatPage,
});

function RiwayatPage() {
  const user = useStore((s) => s.currentUser);
  const transaksi = useStore((s) => s.transaksi);
  const [bulan, setBulan] = useState(todayISO().slice(0, 7));

  const months = useMemo(() => {
    const set = new Set<string>();
    transaksi
      .filter((t) => user && t.bidanIds.includes(user.id))
      .forEach((t) => set.add(t.tanggal.slice(0, 7)));
    set.add(todayISO().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [transaksi, user]);

  const list = useMemo(
    () =>
      transaksi
        .filter(
          (t) =>
            user &&
            t.bidanIds.includes(user.id) &&
            t.tanggal.startsWith(bulan),
        )
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [transaksi, user, bulan],
  );

  const totalTindakan = list.reduce((s, t) => s + t.jumlah, 0);

  return (
    <div className="px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Tindakan</h1>
        <p className="text-sm text-muted-foreground">Semua tindakan yang Anda input</p>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <Select value={bulan} onValueChange={setBulan}>
          <SelectTrigger className="h-11 flex-1">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Jumlah Catatan</p>
          <p className="mt-1 text-2xl font-bold">{list.length}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground shadow-soft">
          <p className="text-xs opacity-80">Total Tindakan</p>
          <p className="mt-1 text-2xl font-bold">{totalTindakan}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Belum ada tindakan di bulan ini.
        </div>
      ) : (
        <ul className="space-y-2 pb-6">
          {list.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {formatTanggal(t.tanggal)}
                  </span>
                  {t.bidanNamas.length > 1 && (
                    <span className="flex items-center gap-1 rounded-md bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                      <Users className="h-3 w-3" /> Tim
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-medium">{t.tarifNama}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.pasien} · {t.jumlah}x
                  {t.bidanNamas.length > 1 &&
                    ` · bersama ${t.bidanNamas
                      .filter((n) => n !== user?.name)
                      .join(", ")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
