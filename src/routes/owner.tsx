import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  ListChecks,
  Users as UsersIcon,
  UserCog,
  KeyRound,
  LogOut,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/owner")({
  component: OwnerLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/owner", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/owner/transaksi", label: "Transaksi", icon: Receipt },
  { to: "/owner/tarif", label: "Master Tarif", icon: ListChecks },
  { to: "/owner/bidan", label: "Daftar Bidan", icon: UserCog },
  { to: "/owner/rekap", label: "Rekap Bidan", icon: UsersIcon },
  { to: "/owner/akun", label: "Akun Owner", icon: KeyRound },
];

function OwnerLayout() {
  const user = useStore((s) => s.currentUser);
  const ready = useStore((s) => s.ready);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (user.role !== "owner") navigate({ to: "/bidan", replace: true });
  }, [user, ready, navigate]);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  if (!ready || !user || user.role !== "owner") return null;

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-semibold">Jasmed Bidan</span>
        </div>
        <button
          onClick={() => setOpenMobile(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          openMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-soft">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Jasmed Bidan</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Owner Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenMobile(false)}
            className="grid h-8 w-8 place-items-center rounded-lg border lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl border bg-card p-3">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="mb-3 text-xs text-muted-foreground">Administrator</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await logout();
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Keluar
          </Button>
        </div>
      </aside>

      {openMobile && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
