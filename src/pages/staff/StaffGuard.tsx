import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessRoles } from "@/hooks/useAccessRoles";

export const StaffGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading } = useAccessRoles();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (!isStaff) return <Navigate to="/chat" replace />;
  return <>{children}</>;
};