import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./store";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let mounted = true;
    void useStore.getState().refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void useStore.getState().refresh();
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return <>{children}</>;
}
