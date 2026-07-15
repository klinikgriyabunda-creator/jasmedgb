import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, PlusCircle, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bidan")({
  component: BidanLayout,
});

const NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/bidan", label: "Beranda", icon: Home, exact: true },
  { to: "/bidan/input", label: "Tindakan", icon: PlusCircle },
  { to: "/bidan/profil", label: "Profil", icon: User },
];

function BidanLayout() {
  const user = useStore((s) => s.currentUser);
  const ready = useStore((s) => s.ready);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (user.role !== "bidan") navigate({ to: "/owner", replace: true });
  }, [user, ready, navigate]);

  if (!ready || !user || user.role !== "bidan") return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-xl">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-3">
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
                  "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition-all",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
