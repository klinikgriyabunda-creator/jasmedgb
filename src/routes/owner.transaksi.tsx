import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Trash2 } from "lucide-react";
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
import { useStore } from "@/lib/store";
import { formatRupiah, formatTanggal, todayISO } from "@/lib/format";

export const Route = createFileRoute("/owner/transaksi")({
  component: TransaksiPage,
});

function TransaksiPage() {
  const transaksi = useStore((s) => s.transaksi);
  const users = useStore((s) => s.users);
  const tarif = useStore((s) => s.tarif);
  const deleteTransaksi = useStore((s) => s.deleteTransaksi);

  const firstOfMonth = todayISO().slice(0, 8) + "01";
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayISO());
  const [bidanId, setBidanId] = useState("all");
  const [tarifId, setTarifId] = useState("all");

  const bidans = users.filter((u) => u.role === "bidan");

  const filtered = useMemo(() => {
    return transaksi
      .filter((t) => t.tanggal >= from && t.tanggal <= to)
      .filter((t) => (bidanId === "all" ? true : t.bidanId === bidanId))
      .filter((t) => (tarifId === "all" ? true : t.tarifId === tarifId))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [transaksi, from, to, bidanId, tarifId]);

  const total = filtered.reduce((s, t) => s + t.subtotal, 0);

  const exportExcel = () => {
    if (filtered.length === 0) return toast.error("Tidak ada data untuk diekspor");
    const data = filtered.map((t) => ({
      Tanggal: formatTanggal(t.tanggal),
      Bidan: t.bidanNama,
      Pasien: t.pasien,
      "Jasa Medis": t.tarifNama,
      Tarif: t.tarifNominal,
      Jumlah: t.jumlah,
      Subtotal: t.subtotal,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 14 }];
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

      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filter
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada transaksi pada rentang ini
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatTanggal(t.tanggal)}</TableCell>
                    <TableCell className="whitespace-nowrap">{t.bidanNama}</TableCell>
                    <TableCell className="whitespace-nowrap">{t.pasien}</TableCell>
                    <TableCell>{t.tarifNama}</TableCell>
                    <TableCell className="text-right">{t.jumlah}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatRupiah(t.subtotal)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
