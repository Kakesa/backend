import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  School, 
  BarChart3, 
  Activity, 
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Crown,
  CreditCard,
  Smartphone,
  UserCog,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ConnectionIndicator } from "./ConnectionIndicator";
import type { User } from "@/types";
import { useHelpStats } from "@/hooks/useHelpStats";

const navigation = [
  { name: "Tableau de bord", href: "/superadmin", icon: LayoutDashboard },
  { name: "Écoles", href: "/superadmin/schools", icon: School },
  { name: "Administrateurs", href: "/superadmin/admins", icon: UserCog },
  { name: "Abonnements", href: "/superadmin/subscriptions", icon: CreditCard },
  { name: "Paiements", href: "/superadmin/payments", icon: Smartphone },
  { name: "Gestion des Demandes", href: "/superadmin/help", icon: MessageSquare },
  { name: "Statistiques", href: "/superadmin/statistics", icon: BarChart3 },
  { name: "Activités", href: "/superadmin/activities", icon: Activity },
  { name: "Paramètres", href: "/superadmin/settings", icon: Settings },
];

export const SuperAdminLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { stats, loading } = useHelpStats();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

const getFullName = (user?: User | null) => {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`;
};

const getInitials = (user?: User | null) => {
  if (!user) return "SA";
  return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
};

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 p-4 sm:p-6 border-b">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base sm:text-lg truncate">EducManager</h1>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 sm:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/superadmin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
                {item.name === "Gestion des Demandes" && !loading && stats.pending > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                    {stats.pending}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="p-2 sm:p-4 border-t">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-accent/50">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                {isLoading ? (
                  <div className="animate-pulse bg-muted h-full w-full rounded-full" />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                    {getInitials(user)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <>
                    <div className="h-3 bg-muted rounded w-3/4 mb-1 animate-pulse" />
                    <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm font-medium truncate">{getFullName(user)}</p>
                    {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 xl:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-4 h-14 sm:h-16 px-3 sm:px-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Connection status indicator */}
          <ConnectionIndicator />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">Abonnement expiré</span>
                  <span className="text-xs text-muted-foreground">
                    Lycée Excellence Hope - Abonnement expiré
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">Nouvelle inscription</span>
                  <span className="text-xs text-muted-foreground">
                    École Primaire du Progrès - En attente d'activation
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">Période d'essai</span>
                  <span className="text-xs text-muted-foreground">
                    1 école en période d'essai
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  {isLoading ? (
                    <div className="animate-pulse bg-muted h-full w-full rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-3 bg-muted rounded w-32 mb-1" />
                    <div className="h-2 bg-muted rounded w-24" />
                  </div>
                ) : (
                  <>
                    <span className="block truncate max-w-[180px]">{getFullName(user)}</span>
                    <span className="text-xs text-muted-foreground block truncate max-w-[180px]">{user?.email}</span>
                  </>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
