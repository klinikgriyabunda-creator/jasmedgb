import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search, X, UserPlus, Plus, Trash2, Users, Calendar } from "lucide-react";
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
import { formatTanggal, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bidan/input")({
  component: InputPage,
});

type TindakanItem = {
  key: string;
  tarifId: string;
  jasaNama: string;
  jumlah: number;
};

function InputPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const tarifList = useStore((s) => s.tarif);
  const transaksi = useStore((s) => s.transaksi);
  const addTransaksi = useStore((s) => s.addTransaksi);
  const requestTarifPending = useStore((s) => s.requestTarifPending);

  const otherBidans = useMemo(
    () => users.filter((u) => u.role === "bidan" && u.id !== user?.id),
    [users, user],
  );

  const [tanggal, setTanggal] = useState(todayISO());
  const [pasien, setPasien] = useState("");
  const [tarifId, setTarifId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [partnerOn, setPartnerOn] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [tindakanList, setTindakanList] = useState<TindakanItem[]>([]);
  const [saving, setSaving] = useState(false);

  const tarif = useMemo(
    () => tarifList.find((t) => t.id === tarifId),
    [tarifList, tarifId],
  );

  const partnerName = useMemo(
    () => (partnerOn && partnerId ? otherBidans.find((u) => u.id === partnerId)?.name ?? null : null),
    [partnerOn, partnerId, otherBidans],
  );

  const [filterMode, setFilterMode] = useState<"tanggal" | "bulan">("tanggal");
  const [filterTanggal, setFilterTanggal] = useState(todayISO());
  const [filterBulan, setFilterBulan] = useState(todayISO().slice(0, 7));

  const riwayatFiltered = useMemo(() => {
    if (!user) return [];
    return transaksi
      .filter((t) => t.bidanIds.includes(user.id))
      .filter((t) =>
        filterMode === "tanggal"
          ? t.tanggal === filterTanggal
          : t.tanggal.startsWith(filterBulan),
      )
      .sort((a, b) =>
        a.tanggal === b.tanggal
          ? a.createdAt.localeCompare(b.createdAt)
          : b.tanggal.localeCompare(a.tanggal),
      );
  }, [transaksi, user, filterMode, filterTanggal, filterBulan]);

  const totalCatatan = riwayatFiltered.length;
  const totalTindakan = riwayatFiltered.reduce((sum, t) => sum + t.jumlah, 0);

  // Group by tanggal + pasien for spreadsheet-style display
  const riwayatRows = useMemo(() => {
    const rows: {
      id: string;
      showTanggal: boolean;
      showPasien: boolean;
      showPartner: boolean;
      tanggal: string;
      pasien: string;
      jasa: string;
      jumlah: number;
      partner: string;
      groupStart: boolean;
    }[] = [];
    let lastTanggal = "";
    let lastPasienKey = "";
    let lastPartner = "";
    for (const t of riwayatFiltered) {
      const partner =
        t.bidanNamas.filter((n) => n !== user?.name).join(", ") || "-";
      const showTanggal = t.tanggal !== lastTanggal;
      const pasienKey = `${t.tanggal}::${t.pasien}`;
      const showPasien = pasienKey !== lastPasienKey;
      const partnerKey = `${t.tanggal}::${partner}`;
      const showPartner = showTanggal || partnerKey !== lastPartner;
      rows.push({
        id: t.id,
        showTanggal,
        showPasien,
        showPartner,
        tanggal: t.tanggal,
        pasien: t.pasien,
        jasa: t.tarifNama,
        jumlah: t.jumlah,
        partner,
        groupStart: showTanggal,
      });
      lastTanggal = t.tanggal;
      lastPasienKey = pasienKey;
      lastPartner = partnerKey;
    }
    return rows;
  }, [riwayatFiltered, user]);

  const resetTindakanFields = () => {
    setTarifId("");
    setJumlah(1);
  };

  const resetAll = () => {
    setPasien("");
    resetTindakanFields();
    setTindakanList([]);
  };

  const addToCart = () => {
    if (!pasien.trim()) return toast.error("Nama pasien wajib diisi");
    if (!tarif) return toast.error("Pilih jasa medis dulu");
    if (jumlah < 1) return toast.error("Jumlah minimal 1");

    setTindakanList((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tarifId: tarif.id,
        jasaNama: tarif.nama,
        jumlah,
      },
    ]);
    resetTindakanFields();
    toast.success("Tindakan ditambahkan ke list");
  };

  const removeFromCart = (key: string) => {
    setTindakanList((prev) => prev.filter((x) => x.key !== key));
  };

  const saveAll = async () => {
    if (!user) return;
    if (!pasien.trim()) return toast.error("Nama pasien wajib diisi");
    if (partnerOn && !partnerId) return toast.error("Pilih bidan partner atau matikan opsi tim");

    let items: TindakanItem[] = tindakanList;
    if (items.length === 0) {
      if (!tarif) return toast.error("Tambahkan minimal 1 tindakan");
      if (jumlah < 1) return toast.error("Jumlah minimal 1");
      items = [{ key: "single", tarifId: tarif.id, jasaNama: tarif.nama, jumlah }];
    }

    const bidanIds = [user.id];
    const bidanNamas = [user.name];
    if (partnerOn && partnerId && partnerName) {
      bidanIds.push(partnerId);
      bidanNamas.push(partnerName);
    }

    setSaving(true);
    try {
      for (const item of items) {
        const t = tarifList.find((x) => x.id === item.tarifId);
        await addTransaksi({
          tanggal,
          bidanIds,
          bidanNamas,
          pasien: pasien.trim(),
          tarifId: item.tarifId,
          tarifNama: item.jasaNama,
          tarifNominal: t?.tarif ?? 0,
          jumlah: item.jumlah,
          subtotal: (t?.tarif ?? 0) * item.jumlah,
        });
      }
      toast.success(`${items.length} tindakan berhasil disimpan untuk ${pasien.trim()}`);
      resetAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Gagal menyimpan", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/bidan" })}
          className="grid h-10 w-10 place-items-center rounded-xl border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Input & Riwayat</h1>
          <p className="text-xs text-muted-foreground">Catat & lihat tindakan Anda</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal</Label>
            <Input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="h-11 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Pasien</Label>
            <Input
              value={pasien}
              onChange={(e) => setPasien(e.target.value)}
              placeholder="Mis. Ibu Sari"
              className="h-11 text-sm"
            />
          </div>
        </div>

        {/* Partner sekali di atas */}
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-semibold">
              Bidan Partner {partnerOn ? "" : <span className="font-normal text-muted-foreground">(opsional)</span>}
            </Label>
            {partnerOn ? (
              <button
                type="button"
                onClick={() => { setPartnerOn(false); setPartnerId(""); }}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3" /> Hapus
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPartnerOn(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <UserPlus className="h-3 w-3" /> Pilih partner
              </button>
            )}
          </div>
          {partnerOn ? (
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="h-11">
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
          ) : (
            <p className="text-xs text-muted-foreground">
              Solo shift — semua tindakan atas nama Anda saja.
            </p>
          )}
        </div>

        {tindakanList.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Keranjang ({tindakanList.length})
              {partnerName && <span className="ml-2 font-normal normal-case text-muted-foreground">bersama {partnerName}</span>}
            </p>
            <ul className="space-y-1.5">
              {tindakanList.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-lg bg-card p-2.5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.jasaNama}</p>
                    <p className="text-xs text-muted-foreground">{item.jumlah}x</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.key)}
                    className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                    aria-label="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Jenis Jasa Medis</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-11 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm",
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
                <CommandInput
                  placeholder="Cari atau ketik jasa baru..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    <span className="text-xs text-muted-foreground">
                      Tidak ditemukan. Gunakan tombol di bawah untuk menambahkan.
                    </span>
                  </CommandEmpty>
                  <CommandGroup>
                    {tarifList.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={`${t.nama} ${t.kategori}`}
                        onSelect={() => {
                          setTarifId(t.id);
                          setOpen(false);
                          setSearch("");
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
                  {search.trim() &&
                    !tarifList.some(
                      (t) => t.nama.toLowerCase() === search.trim().toLowerCase(),
                    ) && (
                      <div className="border-t p-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await requestTarifPending({
                                nama: search.trim(),
                                kategori: "Lainnya",
                              });
                              setOpen(false);
                              setSearch("");
                              toast.success("Jasa medis dikirim ke owner untuk approval tarif");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Gagal mengirim permintaan");
                            }
                          }}
                          className="flex w-full items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4" />
                          Minta tambah jasa baru: "{search.trim()}"
                        </button>
                      </div>
                    )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Jumlah Tindakan</Label>
          <Input
            type="number"
            min={1}
            value={jumlah}
            onChange={(e) => setJumlah(Math.max(1, Number(e.target.value) || 1))}
            className="h-11 text-sm"
          />
          <div className="flex gap-2 pt-1">
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setJumlah(n)}
                className={cn(
                  "h-9 flex-1 rounded-lg border text-sm font-semibold transition-colors",
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

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addToCart}
            className="h-11 border-dashed text-sm"
            disabled={saving}
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah ke List
          </Button>
          <Button
            type="button"
            onClick={saveAll}
            className={cn(
              "h-11 text-sm",
              tindakanList.length === 0 && !tarif && "opacity-50",
            )}
            disabled={saving || (tindakanList.length === 0 && !tarif)}
          >
            <Check className="mr-1 h-4 w-4" />
            {saving
              ? "Menyimpan..."
              : tindakanList.length > 0
                ? `Simpan (${tindakanList.length})`
                : "Simpan"}
          </Button>
        </div>
      </div>

      {/* Riwayat tanggal terpilih */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">
              Riwayat {formatTanggal(tanggal)}
            </h2>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {riwayatHariIni.length} catatan
          </span>
        </div>

        {riwayatHariIni.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Belum ada tindakan pada tanggal ini.
          </div>
        ) : (
          <ul className="space-y-2 pb-6">
            {riwayatHariIni.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{t.tarifNama}</p>
                    {t.bidanNamas.length > 1 && (
                      <span className="flex items-center gap-1 rounded-md bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                        <Users className="h-3 w-3" /> Tim
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.pasien} · {t.jumlah}x
                    {t.bidanNamas.length > 1 &&
                      ` · bersama ${t.bidanNamas.filter((n) => n !== user?.name).join(", ")}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
