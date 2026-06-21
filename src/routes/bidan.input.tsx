import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bidan/input")({
  component: InputPage,
});

function InputPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const tarifList = useStore((s) => s.tarif);
  const addTransaksi = useStore((s) => s.addTransaksi);

  const otherBidans = useMemo(
    () => users.filter((u) => u.role === "bidan" && u.id !== user?.id),
    [users, user],
  );

  const [tanggal, setTanggal] = useState(todayISO());
  const [pasien, setPasien] = useState("");
  const [tarifId, setTarifId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [open, setOpen] = useState(false);
  const [partnerOn, setPartnerOn] = useState(false);
  const [partnerId, setPartnerId] = useState("");

  const tarif = useMemo(
    () => tarifList.find((t) => t.id === tarifId),
    [tarifList, tarifId],
  );

  const reset = () => {
    setPasien("");
    setTarifId("");
    setJumlah(1);
    setPartnerOn(false);
    setPartnerId("");
  };

  const submit = (e: React.FormEvent, again: boolean) => {
    e.preventDefault();
    if (!user) return;
    if (!pasien.trim()) return toast.error("Nama pasien wajib diisi");
    if (!tarif) return toast.error("Pilih jasa medis");
    if (jumlah < 1) return toast.error("Jumlah minimal 1");
    if (partnerOn && !partnerId) return toast.error("Pilih bidan partner atau matikan opsi tim");

    const bidanIds = [user.id];
    const bidanNamas = [user.name];
    if (partnerOn && partnerId) {
      const partner = otherBidans.find((u) => u.id === partnerId);
      if (partner) {
        bidanIds.push(partner.id);
        bidanNamas.push(partner.name);
      }
    }

    addTransaksi({
      tanggal,
      bidanIds,
      bidanNamas,
      pasien: pasien.trim(),
      tarifId: tarif.id,
      tarifNama: tarif.nama,
      tarifNominal: 0, // owner mengisi nominalnya nanti
      jumlah,
      subtotal: 0,
    });
    toast.success("Tindakan tersimpan", {
      description: `${tarif.nama} · ${jumlah}x`,
    });
    if (again) reset();
    else navigate({ to: "/bidan/riwayat" });
  };

  return (
    <div className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/bidan" })}
          className="grid h-10 w-10 place-items-center rounded-xl border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Input Tindakan</h1>
          <p className="text-xs text-muted-foreground">Catat jasa medis Anda</p>
        </div>
      </header>

      <form onSubmit={(e) => submit(e, false)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm">Tanggal</Label>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Nama Pasien</Label>
          <Input
            value={pasien}
            onChange={(e) => setPasien(e.target.value)}
            placeholder="Mis. Ibu Sari"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Jenis Jasa Medis</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-12 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-base",
                  !tarif && "text-muted-foreground",
                )}
              >
                <span className="truncate">
                  {tarif ? tarif.nama : "Pilih jasa medis"}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(92vw,28rem)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Cari jasa medis..." />
                <CommandList>
                  <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {tarifList.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={`${t.nama} ${t.kategori}`}
                        onSelect={() => {
                          setTarifId(t.id);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.nama}</p>
                          <p className="text-xs text-muted-foreground">{t.kategori}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Partner Shift (opsional)</Label>
            {partnerOn ? (
              <button
                type="button"
                onClick={() => { setPartnerOn(false); setPartnerId(""); }}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3" /> Hapus partner
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPartnerOn(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <UserPlus className="h-3 w-3" /> Tambah bidan kedua
              </button>
            )}
          </div>
          {partnerOn && (
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Pilih bidan partner shift" />
              </SelectTrigger>
              <SelectContent>
                {otherBidans.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Dalam satu shift, jika tindakan dilakukan bersama, tambahkan bidan partner Anda.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Jumlah Tindakan</Label>
          <Input
            type="number"
            min={1}
            value={jumlah}
            onChange={(e) => setJumlah(Math.max(1, Number(e.target.value) || 1))}
            className="h-12 text-base"
          />
          <div className="flex gap-2 pt-1">
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setJumlah(n)}
                className={cn(
                  "h-10 flex-1 rounded-lg border text-sm font-semibold transition-colors",
                  jumlah === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed bg-card/60 p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Ringkasan
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {tarif ? tarif.nama : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {jumlah} tindakan · {partnerOn && partnerId ? "Tim 2 Bidan" : "Solo"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button type="submit" variant="outline" className="h-12 text-base">
            Simpan
          </Button>
          <Button
            type="button"
            onClick={(e) => submit(e, true)}
            className="h-12 text-base"
          >
            <Check className="mr-1 h-4 w-4" /> Simpan & Lagi
          </Button>
        </div>
      </form>
    </div>
  );
}
