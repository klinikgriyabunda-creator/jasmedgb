import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import type { Tarif } from "@/lib/types";

export const Route = createFileRoute("/owner/tarif")({
  component: TarifPage,
});

function TarifPage() {
  const tarif = useStore((s) => s.tarif);
  const addTarif = useStore((s) => s.addTarif);
  const updateTarif = useStore((s) => s.updateTarif);
  const deleteTarif = useStore((s) => s.deleteTarif);

  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Tarif | null>(null);

  const kategoriList = useMemo(
    () => Array.from(new Set(tarif.map((t) => t.kategori))).sort(),
    [tarif],
  );

  const filtered = useMemo(() => {
    return tarif
      .filter((t) =>
        kategori === "all" ? true : t.kategori === kategori,
      )
      .filter((t) =>
        t.nama.toLowerCase().includes(search.toLowerCase()),
      );
  }, [tarif, search, kategori]);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Master Tarif</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar jasa medis dan tarifnya</p>
        </div>
        <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-1 h-4 w-4" /> Tambah Tarif
            </Button>
          </DialogTrigger>
          <TarifForm
            editing={editing}
            onSubmit={(v) => {
              if (editing) {
                updateTarif(editing.id, v);
                toast.success("Tarif diperbarui");
              } else {
                addTarif(v);
                toast.success("Tarif ditambahkan");
              }
              setOpenForm(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jasa medis..."
            className="pl-9"
          />
        </div>
        <Select value={kategori} onValueChange={setKategori}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Jasa Medis</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Tarif</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nama}</TableCell>
                  <TableCell>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      {t.kategori}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatRupiah(t.tarif)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditing(t); setOpenForm(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Hapus "${t.nama}"?`)) {
                            deleteTarif(t.id);
                            toast.success("Tarif dihapus");
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
  );
}

function TarifForm({
  editing, onSubmit,
}: { editing: Tarif | null; onSubmit: (v: Omit<Tarif, "id">) => void }) {
  const [nama, setNama] = useState(editing?.nama ?? "");
  const [kategori, setKategori] = useState(editing?.kategori ?? "");
  const [tarif, setTarif] = useState(editing?.tarif ?? 0);

  useEffect(() => {
    setNama(editing?.nama ?? "");
    setKategori(editing?.kategori ?? "");
    setTarif(editing?.tarif ?? 0);
  }, [editing]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Tarif" : "Tambah Tarif"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nama.trim() || !kategori.trim() || tarif < 0) {
            toast.error("Lengkapi semua field");
            return;
          }
          onSubmit({ nama: nama.trim(), kategori: kategori.trim(), tarif });
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Nama Jasa Medis</Label>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} autoFocus />
        </div>
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Input
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            placeholder="Mis. USG, Tindakan, Persalinan"
          />
        </div>
        <div className="space-y-2">
          <Label>Tarif (Rp)</Label>
          <Input
            type="number"
            min={0}
            value={tarif}
            onChange={(e) => setTarif(Number(e.target.value) || 0)}
          />
        </div>
        <DialogFooter>
          <Button type="submit" className="w-full">
            {editing ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
