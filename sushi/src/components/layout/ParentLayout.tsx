import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { ParentNotificationCenter } from "@/components/notifications/ParentNotificationCenter";
import { PushNotificationCenter } from "@/components/notifications/PushNotificationCenter";
import { apiGetParentById } from "@/services/api/parents.api";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Users,
  Mail,
  CalendarDays,
  FileText,
  ClipboardList,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeDropdown } from "@/components/ui/theme-dropdown";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const getParentNavItems = (t: any) => [
  { to: "/parent", icon: LayoutDashboard, label: t("sidebar.dashboard"), end: true },
  { to: "/parent/children", icon: Users, label: "Mes Enfants" },
  { to: "/parent/assignments", icon: ClipboardList, label: t("sidebar.assignments") },
  { to: "/parent/grades", icon: BookOpen, label: "Notes" },
  { to: "/parent/attendance", icon: Calendar, label: "Présences" },
  { to: "/parent/absence-justification", icon: FileText, label: "Justificatifs" },
  { to: "/parent/messaging", icon: Mail, label: "Messagerie", hasNotification: true },
  { to: "/parent/calendar", icon: CalendarDays, label: "Calendrier" },
  { to: "/parent/notifications", icon: Bell, label: "Notifications", badge: 3 },
  { to: "/parent/fees", icon: Wallet, label: t("sidebar.finance") },
  { to: "/parent/help", icon: MessageSquare, label: "Aide & Support" },
  { to: "/parent/settings", icon: Settings, label: t("sidebar.settings") },
];

export function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const parentNavItems = getParentNavItems(t);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const { unreadCount } = useMessageNotifications(user?.id || "parent1");

  useEffect(() => {
    const fetchChildrenCount = async () => {
      const parentId = user?.linkedId || user?.id;
      if (parentId) {
        try {
          const parent = await apiGetParentById(parentId);
          const count = parent.childrenIds?.length || parent.children?.length || 0;
          setChildrenCount(count);
        } catch (error) {
          console.error("Error fetching parent for child count:", error);
        }
      }
    };
    fetchChildrenCount();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Espace Parent</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="border-b p-4">
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">Parent d'élève</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {parentNavItems.map((item) => {
              const badge = item.label === "Mes Enfants" ? childrenCount : item.badge;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.hasNotification && unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                  {badge && !item.hasNotification && (
                    <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card px-4">
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Espace Parent</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {/* Avatar de profil */}
            <ProfileAvatar
              src={user?.avatarUrl}
              alt={`${user?.name} ${user?.firstName || ''} ${user?.lastName || ''}`}
              userType="parent"
              userId={user?.linkedId}
              size="sm"
              showStatus={true}
              status="online"
            />
            <PushNotificationCenter userId={user?.id || "parent1"} userRole="parent" />
            <ParentNotificationCenter parentId={user?.id || "par1"} />
            <ThemeDropdown />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
