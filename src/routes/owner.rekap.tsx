import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Stethoscope, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore } from "@/lib/store";
import { formatRupiah, formatTanggal, todayISO } from "@/lib/format";

export const Route = createFileRoute("/owner/rekap")({
  component: RekapPage,
});

function RekapPage() {
  const transaksi = useStore((s) => s.transaksi);
  const users = useStore((s) => s.users);

  const firstOfMonth = todayISO().slice(0, 8) + "01";
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayISO());

  const bidans = users.filter((u) => u.role === "bidan");

  const rekap = useMemo(() => {
    const filtered = transaksi.filter((t) => t.tanggal >= from && t.tanggal <= to);
    return bidans
      .map((b) => {
        const items = filtered
          .filter((t) => t.bidanIds.includes(b.id))
          .sort((a, b2) => b2.tanggal.localeCompare(a.tanggal));
        // Setiap bidan menerima tarif penuh per tindakan (tidak dibagi partner)
        return {
          bidanId: b.id,
          nama: b.name,
          items,
          total: items.reduce((s, t) => s + t.subtotal, 0),
          tindakan: items.reduce((s, t) => s + t.jumlah, 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [transaksi, bidans, from, to]);

  const grandTotal = rekap.reduce((s, b) => s + b.total, 0);

  const exportRekap = () => {
    if (grandTotal === 0) return toast.error("Tidak ada data untuk diekspor");
    const wb = XLSX.utils.book_new();

    const summary = rekap.map((b) => ({
      Bidan: b.nama,
      "Jumlah Transaksi": b.items.length,
      "Total Tindakan": b.tindakan,
      "Total Jasmed (bagian)": Math.round(b.total),
    }));
    summary.push({
      Bidan: "TOTAL KESELURUHAN",
      "Jumlah Transaksi": rekap.reduce((s, b) => s + b.items.length, 0),
      "Total Tindakan": rekap.reduce((s, b) => s + b.tindakan, 0),
      "Total Jasmed (bagian)": Math.round(grandTotal),
    });
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Rekap Per Bidan");

    const detail = rekap.flatMap((b) =>
      b.items.map((t) => ({
        Tanggal: formatTanggal(t.tanggal),
        Bidan: b.nama,
        "Tim Bidan": t.bidanNamas.join(" & "),
        Pasien: t.pasien,
        "Jasa Medis": t.tarifNama,
        Tarif: t.tarifNominal,
        Jumlah: t.jumlah,
        Subtotal: t.subtotal,
        "Bagian Bidan": t.subtotal,
      })),
    );
    const wsDetail = XLSX.utils.json_to_sheet(detail);
    wsDetail["!cols"] = [
      { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 30 },
      { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Transaksi");

    XLSX.writeFile(wb, `rekap-jasmed-${from}_to_${to}.xlsx`);
    toast.success("Rekap berhasil diunduh");
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Rekap per Bidan</h1>
          <p className="text-sm text-muted-foreground">
            Setiap bidan menerima tarif penuh (tim shift tidak dibagi)
          </p>
        </div>
        <Button onClick={exportRekap}>
          <Download className="mr-1 h-4 w-4" /> Export Rekap
        </Button>
      </header>

      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Dari Tanggal</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai Tanggal</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3 text-primary-foreground">
            <p className="text-[10px] uppercase tracking-wide opacity-80">Grand Total</p>
            <p className="text-xl font-bold">{formatRupiah(grandTotal)}</p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {rekap.map((b) => (
          <AccordionItem
            key={b.bidanId}
            value={b.bidanId}
            className="overflow-hidden rounded-2xl border bg-card shadow-card"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 pr-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold">{b.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.items.length} transaksi · {b.tindakan} tindakan
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-base font-bold text-primary">
                  {formatRupiah(b.total)}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t bg-muted/30 px-5 py-3">
              {b.items.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Tidak ada transaksi pada rentang ini.
                </p>
              ) : (
                <ul className="divide-y">
                  {b.items.map((t) => {
                    const isTim = t.bidanIds.length > 1;
                    const share = isTim ? t.subtotal / t.bidanIds.length : t.subtotal;
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{t.tarifNama}</p>
                            {isTim && (
                              <span className="flex items-center gap-1 rounded-md bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                                <Users className="h-3 w-3" /> Tim
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatTanggal(t.tanggal)} · {t.pasien} · {t.jumlah}x
                            {isTim && ` · dibagi ${t.bidanIds.length}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-primary">
                            {formatRupiah(share)}
                          </p>
                          {isTim && (
                            <p className="text-[10px] text-muted-foreground">
                              dari {formatRupiah(t.subtotal)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
