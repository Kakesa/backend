import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("superadmin" | "admin" | "teacher" | "student" | "parent" | "accountant")[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Rediriger vers le bon dashboard selon le rôle
    const redirectMap = {
      superadmin: "/superadmin",
      admin: "/dashboard",
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
      accountant: "/accountant",
    };
    return <Navigate to={redirectMap[user.role as keyof typeof redirectMap]} replace />;
  }

  return <>{children}</>;
};
