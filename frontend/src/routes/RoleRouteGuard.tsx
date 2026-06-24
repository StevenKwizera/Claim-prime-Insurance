import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath } from "@/config/roleAccess";
import { useAuth } from "@/hooks/useAuth";

export const RoleRouteGuard = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user && !canAccessPath(pathname, user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
