import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  const ready = useStore((s) => s.ready);
  useEffect(() => {
    if (!ready) return;
    if (user?.role === "owner") navigate({ to: "/owner", replace: true });
    else if (user?.role === "bidan") navigate({ to: "/bidan", replace: true });
    else navigate({ to: "/login", replace: true });
  }, [user, ready, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
    </div>
  );
}
