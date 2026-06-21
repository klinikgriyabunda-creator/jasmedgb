import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, TrendingUp, CalendarDays, PlusCircle, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRupiah, greeting, todayISO } from "@/lib/format";

export const Route = createFileRoute("/bidan/")({
  component: BidanHome,
});

function BidanHome() {
  const user = useStore((s) => s.currentUser);
  const transaksi = useStore((s) => s.transaksi);

  const stats = useMemo(() => {
    if (!user) return { tindakanHariIni: 0, jasmedHariIni: 0, jasmedBulanIni: 0 };
    const today = todayISO();
    const month = today.slice(0, 7);
    const mine = transaksi.filter((t) => t.bidanId === user.id);
    const hariIni = mine.filter((t) => t.tanggal === today);
    const bulanIni = mine.filter((t) => t.tanggal.startsWith(month));
    return {
      tindakanHariIni: hariIni.reduce((s, t) => s + t.jumlah, 0),
      jasmedHariIni: hariIni.reduce((s, t) => s + t.subtotal, 0),
      jasmedBulanIni: bulanIni.reduce((s, t) => s + t.subtotal, 0),
    };
  }, [transaksi, user]);

  return (
    <div className="space-y-5 px-4 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {user?.name} 👋
        </h1>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Tindakan Hari Ini"
          value={String(stats.tindakanHariIni)}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Jasmed Hari Ini"
          value={formatRupiah(stats.jasmedHariIni)}
          accent="bg-secondary/15 text-secondary"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label="Bulan Ini"
          value={formatRupiah(stats.jasmedBulanIni)}
          accent="bg-accent text-accent-foreground"
        />
      </section>

      <Link
        to="/bidan/input"
        className="group block overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm/none opacity-90">Cepat & Mudah</p>
            <h3 className="mt-2 text-xl font-bold">Input Tindakan Baru</h3>
            <p className="mt-1 text-sm opacity-90">
              Catat jasa medis Anda dalam hitungan detik.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 transition-transform group-hover:scale-110">
            <PlusCircle className="h-6 w-6" />
          </div>
        </div>
      </Link>

      <RecentList />
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card">
      <div className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function RecentList() {
  const user = useStore((s) => s.currentUser);
  const transaksi = useStore((s) => s.transaksi);
  const mine = useMemo(
    () => transaksi.filter((t) => t.bidanId === user?.id).slice(0, 5),
    [transaksi, user],
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Aktivitas Terbaru</h2>
        <Link to="/bidan/riwayat" className="flex items-center gap-1 text-xs font-medium text-primary">
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Belum ada tindakan. Mulai input sekarang!
        </div>
      ) : (
        <ul className="space-y-2">
          {mine.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.tarifNama}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.pasien} · {t.jumlah}x
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-primary">
                {formatRupiah(t.subtotal)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
