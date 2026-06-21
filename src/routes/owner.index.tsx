import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Receipt, Crown, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRupiah, todayISO } from "@/lib/format";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard;
});

const COLORS = ["#0D9488", "#10B981", "#0EA5E9", "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6", "#6366F1"];

function OwnerDashboard() {
  const transaksi = useStore((s) => s.transaksi);
  const users = useStore((s) => s.users);

  const data = useMemo(() => {
    const month = todayISO().slice(0, 7);
    const bulanIni = transaksi.filter((t) => t.tanggal.startsWith(month));
    const totalBulan = bulanIni.reduce((s, t) => s + t.subtotal, 0);

    const perBidan = new Map<string, { nama: string; total: number; count: number }>();
    users.filter((u) => u.role === "bidan").forEach((u) =>
      perBidan.set(u.id, { nama: u.name.replace("Bidan ", ""), total: 0, count: 0 }),
    );
    bulanIni.forEach((t) => {
      const e = perBidan.get(t.bidanId);
      if (e) {
        e.total += t.subtotal;
        e.count += t.jumlah;
      }
    });
    const bidanArr = Array.from(perBidan.values()).sort((a, b) => b.total - a.total);
    const top = bidanArr[0];

    const perTindakan = new Map<string, number>();
    bulanIni.forEach((t) => {
      perTindakan.set(t.tarifNama, (perTindakan.get(t.tarifNama) || 0) + t.jumlah);
    });
    const tindakanArr = Array.from(perTindakan, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      totalBulan,
      jumlahTransaksi: bulanIni.length,
      topBidan: top,
      bidanArr,
      tindakanArr,
    };
  }, [transaksi, users]);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan bulan{" "}
          {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Jasmed"
          value={formatRupiah(data.totalBulan)}
          accent="bg-primary text-primary-foreground"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Total Transaksi"
          value={String(data.jumlahTransaksi)}
          accent="bg-secondary text-secondary-foreground"
        />
        <StatCard
          icon={<Crown className="h-5 w-5" />}
          label="Bidan Paling Aktif"
          value={data.topBidan?.total ? data.topBidan.nama : "—"}
          sub={data.topBidan?.total ? formatRupiah(data.topBidan.total) : "Belum ada data"}
          accent="bg-amber-500 text-white"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Bidan Aktif"
          value={String(data.bidanArr.filter((b) => b.count > 0).length)}
          accent="bg-sky-500 text-white"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold">Jasmed per Bidan (Bulan Ini)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bidanArr}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="nama" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(v: number) => formatRupiah(v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="total" fill="#0D9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Top Tindakan</h3>
          {data.tindakanArr.length === 0 ? (
            <div className="grid h-72 place-items-center text-sm text-muted-foreground">
              Belum ada data
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tindakanArr}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.tindakanArr.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
