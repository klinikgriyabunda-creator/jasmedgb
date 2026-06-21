import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Stethoscope, BadgeCheck } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/bidan/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const user = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const transaksi = useStore((s) => s.transaksi);
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const mine = transaksi.filter((t) => t.bidanId === user?.id);
    return {
      count: mine.length,
      total: mine.reduce((s, t) => s + t.subtotal, 0),
    };
  }, [transaksi, user]);

  return (
    <div className="px-4 pt-6">
      <header className="mb-6 flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-soft">
          <Stethoscope className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-xl font-bold">{user?.name}</h1>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Bidan terverifikasi
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Tindakan</p>
          <p className="mt-1 text-xl font-bold">{summary.count}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Jasmed</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatRupiah(summary.total)}</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="h-12 w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => {
          logout();
          navigate({ to: "/login", replace: true });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Keluar
      </Button>
    </div>
  );
}
