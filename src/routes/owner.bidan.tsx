import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/owner/bidan")({
  component: BidanManagePage,
});

function BidanManagePage() {
  const users = useStore((s) => s.users);
  const transaksi = useStore((s) => s.transaksi);
  const addBidan = useStore((s) => s.addBidan);
  const updateBidan = useStore((s) => s.updateBidan);
  const deleteBidan = useStore((s) => s.deleteBidan);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  const bidans = users.filter((u) => u.role === "bidan");

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Daftar Bidan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar bidan dan kredensial login mereka
          </p>
        </div>
        <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-1 h-4 w-4" /> Tambah Bidan
            </Button>
          </DialogTrigger>
          <BidanForm
            editing={editing}
            existingUsernames={users.map((u) => u.username.toLowerCase())}
            onSubmit={async (v) => {
              try {
                if (editing) {
                  await updateBidan(editing.id, v);
                  toast.success("Data bidan diperbarui");
                } else {
                  await addBidan(v);
                  toast.success("Bidan ditambahkan");
                }
                setOpenForm(false);
                setEditing(null);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
              }
            }}
          />
        </Dialog>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Jumlah Bidan</p>
          <p className="mt-1 text-2xl font-bold">{bidans.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Transaksi</p>
          <p className="mt-1 text-2xl font-bold">{transaksi.length}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground">
          <p className="text-xs opacity-80">Aktif Bulan Ini</p>
          <p className="mt-1 text-2xl font-bold">
            {
              new Set(
                transaksi
                  .filter((t) => t.tanggal.startsWith(new Date().toISOString().slice(0, 7)))
                  .flatMap((t) => t.bidanIds),
              ).size
            }
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bidan</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Transaksi</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bidans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                    Belum ada bidan. Tambahkan bidan baru.
                  </TableCell>
                </TableRow>
              ) : (
                bidans.map((b) => {
                  const count = transaksi.filter((t) => t.bidanIds.includes(b.id)).length;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{b.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted px-2 py-0.5 text-xs">{b.username}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="rounded-md bg-muted px-2 py-0.5 text-xs">
                            {showPw[b.id] ? b.password : "••••••••"}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setShowPw((s) => ({ ...s, [b.id]: !s[b.id] }))}
                          >
                            {showPw[b.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setEditing(b); setOpenForm(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (count > 0) {
                                return toast.error("Tidak bisa menghapus: bidan ini punya transaksi");
                              }
                              if (confirm(`Hapus "${b.name}"?`)) {
                                deleteBidan(b.id);
                                toast.success("Bidan dihapus");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function BidanForm({
  editing,
  existingUsernames,
  onSubmit,
}: {
  editing: User | null;
  existingUsernames: string[];
  onSubmit: (v: { name: string; username: string; password: string }) => void;
}) {
  const [name, setName] = useState(editing?.name.replace(/^Bidan\s+/, "") ?? "");
  const [username, setUsername] = useState(editing?.username ?? "");
  const [password, setPassword] = useState(editing?.password ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Bidan" : "Tambah Bidan"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !username.trim() || !password.trim()) {
            return toast.error("Lengkapi semua field");
          }
          const uname = username.trim().toLowerCase();
          const isDuplicate =
            existingUsernames.includes(uname) &&
            uname !== editing?.username.toLowerCase();
          if (isDuplicate) return toast.error("Username sudah dipakai");
          onSubmit({ name: name.trim(), username: uname, password: password.trim() });
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Nama Bidan</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mis. Fika"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Akan ditampilkan sebagai "Bidan {name || "..."}"</p>
        </div>
        <div className="space-y-2">
          <Label>Email Login</Label>
          <Input
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mis. fika@klinik.com"
          />
          <p className="text-xs text-muted-foreground">Bidan akan login menggunakan email ini.</p>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 karakter"
          />
        </div>
        <DialogFooter>
          <Button type="submit" className="w-full">
            {editing ? "Simpan Perubahan" : "Tambah Bidan"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
