import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ShieldCheck, Stethoscope, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — Jasmed Bidan" },
      { name: "description", content: "Masuk ke aplikasi manajemen jasa medis bidan." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [role, setRole] = useState<"owner" | "bidan" | null>(null);
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent, asRole: "owner" | "bidan") => {
    e.preventDefault();
    const found = users.find(
      (u) =>
        u.role === asRole &&
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password,
    );
    if (!found) return toast.error("Username atau password salah");
    login(found);
    toast.success(`Selamat datang, ${found.name}`);
    navigate({ to: asRole === "owner" ? "/owner" : "/bidan" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-accent/40 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Jasmed Bidan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manajemen Jasa Medis — cepat, rapi, dan terpercaya.
          </p>
        </div>

        {!role && (
          <div className="grid gap-5 sm:grid-cols-2">
            <button
              onClick={() => { setRole("owner"); setUsername(""); setPassword(""); }}
              className="group rounded-2xl border bg-card p-7 text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary hover:shadow-soft"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Owner</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola tarif, monitor transaksi, dan ekspor laporan.
              </p>
            </button>
            <button
              onClick={() => { setRole("bidan"); setUsername(""); setPassword(""); }}
              className="group rounded-2xl border bg-card p-7 text-left shadow-card transition-all hover:-translate-y-1 hover:border-secondary hover:shadow-soft"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Bidan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Input tindakan harian dan lihat riwayat tindakan Anda.
              </p>
            </button>
          </div>
        )}

        {role && (
          <Card className="mx-auto max-w-md p-6">
            <form onSubmit={(e) => handleSubmit(e, role)} className="space-y-4">
              <h3 className="text-lg font-semibold">
                Masuk sebagai {role === "owner" ? "Owner" : "Bidan"}
              </h3>
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-9"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === "owner" ? "owner" : "mis. fika"}
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    className="h-11 pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setRole(null)}>
                  Kembali
                </Button>
                <Button type="submit" className="h-11 flex-1">Masuk</Button>
              </div>
            </form>
          </Card>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Demo: <span className="font-medium">owner / admin123</span> ·{" "}
          <span className="font-medium">fika / bidan123</span>
        </p>
      </div>
    </div>
  );
}
