import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminStore";

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
