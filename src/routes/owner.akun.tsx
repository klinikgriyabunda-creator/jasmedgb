import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Plus, Pencil, Trash2, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/owner/akun")({
  head: () => ({
    meta: [{ title: "Akun Owner — Jasmed Bidan" }],
  }),
  component: AkunPage,
});

function AkunPage() {
  const users = useStore((s) => s.users);
  const addOwner = useStore((s) => s.addOwner);
  const updateOwner = useStore((s) => s.updateOwner);
  const deleteOwner = useStore((s) => s.deleteOwner);

  const owners = users.filter((u) => u.role === "owner");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", username: "", password: "", email: "" });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      username: u.username,
      password: u.password,
      email: u.email ?? "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error("Nama, username, dan password wajib diisi");
      return;
    }
    const dup = owners.some(
      (o) =>
        o.username.toLowerCase() === form.username.trim().toLowerCase() &&
        o.id !== editing?.id,
    );
    if (dup) {
      toast.error("Username sudah dipakai owner lain");
      return;
    }
    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim() || undefined,
    };
    if (editing) {
      updateOwner(editing.id, payload);
      toast.success("Akun owner diperbarui");
    } else {
      addOwner(payload);
      toast.success("Akun owner ditambahkan");
    }
    setOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <KeyRound className="h-6 w-6 text-primary" /> Akun Owner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola username, password, dan email pemulihan untuk akun owner.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Owner
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {owners.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold">{o.name}</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {owners.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus akun owner?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Akun {o.name} ({o.username}) akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteOwner(o.id);
                            toast.success("Akun owner dihapus");
                          }}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium">{o.username}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Password</dt>
                <dd className="flex items-center gap-2 font-mono">
                  <span>{showPw[o.id] ? o.password : "••••••••"}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setShowPw((s) => ({ ...s, [o.id]: !s[o.id] }))
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPw[o.id] ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email pemulihan</dt>
                <dd className="flex items-center gap-1 text-right font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {o.email || "—"}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Akun Owner" : "Tambah Akun Owner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="mis. Owner Utama"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="mis. zai190191"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password login"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email pemulihan</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@domain.com"
              />
              <p className="text-xs text-muted-foreground">
                Digunakan untuk pemulihan password bila lupa.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
