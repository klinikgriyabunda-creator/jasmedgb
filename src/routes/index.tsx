import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  useEffect(() => {
    if (user?.role === "owner") navigate({ to: "/owner", replace: true });
    else if (user?.role === "bidan") navigate({ to: "/bidan", replace: true });
    else navigate({ to: "/login", replace: true });
  }, [user, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
    </div>
  );
}
