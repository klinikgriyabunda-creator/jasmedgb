import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Pencil, Trash2, AlertCircle, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { formatRupiah, formatTanggal, todayISO } from "@/lib/format";
import type { Transaksi } from "@/lib/types";

export const Route = createFileRoute("/owner/transaksi")({
  component: TransaksiPage,
});

function TransaksiPage() {
  const transaksi = useStore((s) => s.transaksi);
  const users = useStore((s) => s.users);
  const tarif = useStore((s) => s.tarif);
  const deleteTransaksi = useStore((s) => s.deleteTransaksi);
  const updateTransaksi = useStore((s) => s.updateTransaksi);

  const firstOfMonth = todayISO().slice(0, 8) + "01";
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayISO());
  const [bidanId, setBidanId] = useState("all");
  const [tarifId, setTarifId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending">("all");
  const [editing, setEditing] = useState<Transaksi | null>(null);

  const bidans = users.filter((u) => u.role === "bidan");

  const filtered = useMemo(() => {
    return transaksi
      .filter((t) => t.tanggal >= from && t.tanggal <= to)
      .filter((t) => (bidanId === "all" ? true : t.bidanIds.includes(bidanId)))
      .filter((t) => (tarifId === "all" ? true : t.tarifId === tarifId))
      .filter((t) => (statusFilter === "pending" ? t.tarifNominal === 0 : true))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [transaksi, from, to, bidanId, tarifId, statusFilter]);

  const total = filtered.reduce((s, t) => s + t.subtotal, 0);
  const pendingCount = filtered.filter((t) => t.tarifNominal === 0).length;

  const exportExcel = () => {
    if (filtered.length === 0) return toast.error("Tidak ada data untuk diekspor");
    const data = filtered.map((t) => ({
      Tanggal: formatTanggal(t.tanggal),
      Bidan: t.bidanNamas.join(" & "),
      Pasien: t.pasien,
      "Jasa Medis": t.tarifNama,
      Tarif: t.tarifNominal,
      Jumlah: t.jumlah,
      Subtotal: t.subtotal,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `transaksi-jasmed-${from}_to_${to}.xlsx`);
    toast.success("File Excel berhasil diunduh");
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Transaksi Masuk</h1>
          <p className="text-sm text-muted-foreground">Semua tindakan dari seluruh bidan</p>
        </div>
        <Button onClick={exportExcel}>
          <Download className="mr-1 h-4 w-4" /> Export Excel
        </Button>
      </header>

      {pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">{pendingCount} transaksi belum diisi tarifnya</p>
            <p className="opacity-90">Klik ikon edit di tabel untuk mengisi nominal tarif.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filter
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Dari Tanggal</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bidan</Label>
            <Select value={bidanId} onValueChange={setBidanId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bidan</SelectItem>
                {bidans.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jasa Medis</Label>
            <Select value={tarifId} onValueChange={setTarifId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Semua Jasa</SelectItem>
                {tarif.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(v: "all" | "pending") => setStatusFilter(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending">Belum diisi tarif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Transaksi</p>
          <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Tindakan</p>
          <p className="mt-1 text-2xl font-bold">
            {filtered.reduce((s, t) => s + t.jumlah, 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground shadow-soft">
          <p className="text-xs opacity-80">Total Jasmed</p>
          <p className="mt-1 text-2xl font-bold">{formatRupiah(total)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Bidan</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Jasa Medis</TableHead>
                <TableHead className="text-right">Tarif</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada transaksi pada rentang ini
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className={t.tarifNominal === 0 ? "bg-amber-50/40" : ""}>
                    <TableCell className="whitespace-nowrap text-xs">{formatTanggal(t.tanggal)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {t.bidanNamas.length > 1 && <Users className="h-3.5 w-3.5 text-secondary" />}
                        <span>{t.bidanNamas.join(" & ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{t.pasien}</TableCell>
                    <TableCell>{t.tarifNama}</TableCell>
                    <TableCell className="text-right">
                      {t.tarifNominal === 0 ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Belum diisi
                        </span>
                      ) : (
                        formatRupiah(t.tarifNominal)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{t.jumlah}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatRupiah(t.subtotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Hapus transaksi ini?")) {
                              deleteTransaksi(t.id);
                              toast.success("Transaksi dihapus");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <EditTransaksiForm
            transaksi={editing}
            onSubmit={(v) => {
              updateTransaksi(editing.id, v);
              toast.success("Transaksi diperbarui");
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function EditTransaksiForm({
  transaksi: t,
  onSubmit,
}: {
  transaksi: Transaksi;
  onSubmit: (v: Omit<Transaksi, "id" | "createdAt">) => void;
}) {
  const tarifList = useStore((s) => s.tarif);
  const users = useStore((s) => s.users);
  const bidans = users.filter((u) => u.role === "bidan");

  const [tanggal, setTanggal] = useState(t.tanggal);
  const [pasien, setPasien] = useState(t.pasien);
  const [tarifId, setTarifId] = useState(t.tarifId);
  const [tarifNominal, setTarifNominal] = useState(t.tarifNominal);
  const [jumlah, setJumlah] = useState(t.jumlah);
  const [bidan1, setBidan1] = useState(t.bidanIds[0] ?? "");
  const [bidan2, setBidan2] = useState(t.bidanIds[1] ?? "");

  const selectedTarif = tarifList.find((x) => x.id === tarifId);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Transaksi</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedTarif) return toast.error("Pilih jasa medis");
          if (!bidan1) return toast.error("Bidan utama wajib diisi");
          if (!pasien.trim()) return toast.error("Nama pasien wajib diisi");

          const ids = [bidan1];
          const namas = [bidans.find((b) => b.id === bidan1)?.name ?? ""];
          if (bidan2 && bidan2 !== bidan1) {
            ids.push(bidan2);
            namas.push(bidans.find((b) => b.id === bidan2)?.name ?? "");
          }

          onSubmit({
            tanggal,
            pasien: pasien.trim(),
            bidanIds: ids,
            bidanNamas: namas,
            tarifId: selectedTarif.id,
            tarifNama: selectedTarif.nama,
            tarifNominal,
            jumlah,
            subtotal: tarifNominal * jumlah,
          });
        }}
        className="grid gap-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pasien</Label>
            <Input value={pasien} onChange={(e) => setPasien(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Jasa Medis</Label>
          <Select value={tarifId} onValueChange={setTarifId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {tarifList.map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tarif (Rp)</Label>
            <Input
              type="number"
              min={0}
              value={tarifNominal}
              onChange={(e) => setTarifNominal(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Jumlah</Label>
            <Input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Bidan Utama</Label>
            <Select value={bidan1} onValueChange={setBidan1}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {bidans.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Bidan Kedua (opsional)</Label>
            <Select value={bidan2 || "none"} onValueChange={(v) => setBidan2(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tidak ada —</SelectItem>
                {bidans.filter((b) => b.id !== bidan1).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Subtotal:{" "}
          <span className="font-bold text-primary">
            {formatRupiah(tarifNominal * jumlah)}
          </span>
        </div>

        <DialogFooter>
          <Button type="submit" className="w-full">Simpan Perubahan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
