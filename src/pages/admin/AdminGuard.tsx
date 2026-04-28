import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/adminStore";

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      // Fall back to email check if roles row not yet inserted
      const ok = !!data && !error
        ? true
        : user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setIsAdmin(ok);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};
