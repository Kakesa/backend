import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  CalendarDays,
  Target,
  Wallet,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentNotifications } from "@/hooks/useStudentNotifications";
import { PushNotificationCenter } from "@/components/notifications/PushNotificationCenter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeDropdown } from "@/components/ui/theme-dropdown";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const getStudentMenuItems = (t: any) => [
  { icon: LayoutDashboard, label: t("sidebar.dashboard"), path: "/student" },
  { icon: BookOpen, label: t("sidebar.grades"), path: "/student/grades" },
  { icon: ClipboardList, label: t("sidebar.assignments"), path: "/student/assignments" },
  { icon: Target, label: "Mes Compétences", path: "/student/competences" },
  { icon: Calendar, label: "Emploi du temps", path: "/student/schedule" },
  { icon: ClipboardCheck, label: t("sidebar.attendance"), path: "/student/attendance" },
  { icon: Mail, label: "Messagerie", path: "/student/messaging" },
  { icon: CalendarDays, label: "Calendrier", path: "/student/calendar" },
  { icon: Wallet, label: t("sidebar.finance"), path: "/student/fees" },
  { icon: MessageSquare, label: "Aide & Support", path: "/student/help" },
  { icon: Settings, label: t("sidebar.settings"), path: "/student/settings" },
];

export function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const studentMenuItems = getStudentMenuItems(t);
  const {
    counts,
    markMessagesAsRead,
    markGradesAsViewed,
    markAssignmentsAsViewed,
    markFeesAsViewed,
  } = useStudentNotifications(user?.id || "");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Réinitialiser les badges selon la page visitée
  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/student/messaging")) {
      markMessagesAsRead();
    } else if (path.includes("/student/grades")) {
      markGradesAsViewed();
    } else if (path.includes("/student/assignments")) {
      markAssignmentsAsViewed();
    } else if (path.includes("/student/fees")) {
      markFeesAsViewed();
    }
  }, [
    location.pathname,
    markMessagesAsRead,
    markGradesAsViewed,
    markAssignmentsAsViewed,
    markFeesAsViewed,
  ]);

  // Créer un objet pour mapper les badges aux items
  const badgeMap: Record<string, number> = {
    "/student/messaging": counts.messages,
    "/student/grades": counts.grades,
    "/student/assignments": counts.assignments,
    "/student/fees": counts.fees,
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${sidebarOpen ? "w-64" : "w-16"
          } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg text-foreground">Espace Élève</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {studentMenuItems.map((item) => {
              const badgeCount = badgeMap[item.path];
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/student"}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
                    activeClassName="bg-primary/10 text-primary font-medium"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span className="flex-1">{item.label}</span>}
                    </div>
                    {sidebarOpen && badgeCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center ml-1 shrink-0"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-16"}`}>
        {/* Header avec notifications */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-card px-6">
          {/* Avatar de profil */}
          <ProfileAvatar
            src={user?.avatarUrl}
            alt={`${user?.name} ${user?.firstName || ''} ${user?.lastName || ''}`}
            userType="student"
            userId={user?.linkedId}
            size="sm"
            showStatus={true}
            status="online"
          />
          <PushNotificationCenter userId={user?.id || "student1"} userRole="student" />
          <ThemeDropdown />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
