import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAccessRoles = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsStaff(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [adminRes, staffRes] = await Promise.all([
      supabase.rpc("is_admin"),
      supabase.rpc("is_staff"),
    ]);
    setIsAdmin(adminRes.data === true && !adminRes.error);
    setIsStaff(staffRes.data === true && !staffRes.error);
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isAdmin, isStaff, loading: authLoading || loading, refresh };
};