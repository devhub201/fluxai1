import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "@/lib/adminStore";

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
