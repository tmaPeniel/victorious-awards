import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminSession = {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useSession(): AdminSession {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkRole = async (s: Session | null) => {
      if (!s) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", s.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(Boolean(data));
        setLoading(false);
      }
    };

    // Subscribe first
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      // Defer Supabase call to avoid deadlock with auth callback
      setTimeout(() => void checkRole(s), 0);
    });

    // Then initial fetch
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      void checkRole(data.session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, isAdmin, loading };
}
