import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { PushNotificationCenter } from "@/components/notifications/PushNotificationCenter";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  QrCode,
  ClipboardList,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Mail,
  FileCheck,
  Calendar,
  Target,
  UserX,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeDropdown } from "@/components/ui/theme-dropdown";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const getTeacherNavItems = (t: any) => [
  { to: "/teacher", icon: LayoutDashboard, label: t("sidebar.dashboard"), end: true },
  { to: "/teacher/classes", icon: Users, label: "Mes Classes" },
  { to: "/teacher/assignments", icon: ClipboardList, label: t("sidebar.assignments") },
  { to: "/teacher/grades", icon: ClipboardList, label: "Saisie des Notes" },
  { to: "/teacher/corrections", icon: FileCheck, label: "Corrections" },
  { to: "/teacher/competences", icon: Target, label: "Compétences" },
  { to: "/teacher/attendance", icon: QrCode, label: "Appel QR Code" },
  { to: "/teacher/absences", icon: UserX, label: "Gestion des Absences" },
  { to: "/teacher/schedule", icon: BookOpen, label: "Emploi du temps" },
  { to: "/teacher/calendar", icon: Calendar, label: "Calendrier" },
  { to: "/teacher/messaging", icon: Mail, label: "Messagerie", hasNotification: true },
  { to: "/teacher/help", icon: MessageSquare, label: "Aide & Support" },
  { to: "/teacher/settings", icon: Settings, label: t("sidebar.settings") },
];

export function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useMessageNotifications(user?.id || "teacher1");

  const teacherNavItems = getTeacherNavItems(t);

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
              <span className="font-semibold">Espace Professeur</span>
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
            <p className="text-sm text-muted-foreground">Professeur</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {teacherNavItems.map((item) => (
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
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t("common.logout")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card px-4">
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Espace Professeur</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {/* Avatar de profil */}
            <ProfileAvatar
              src={user?.avatarUrl}
              alt={`${user?.name} ${user?.firstName || ''} ${user?.lastName || ''}`}
              userType="teacher"
              userId={user?.linkedId}
              size="sm"
              showStatus={true}
              status="online"
            />
            <PushNotificationCenter userId={user?.id || "teacher1"} userRole="teacher" />
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
