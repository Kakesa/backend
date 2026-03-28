/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  QrCode,
  Mail,
  Shield,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserCircle,
  BarChart3,
  FileCheck,
  Wallet,
  MapPin,
  X,
  UserMinus,
  MessageSquare,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationBadges } from "@/hooks/useNavigationBadges";
import { useHelpNotifications } from "@/hooks/useHelpNotifications";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface MenuItem {
  icon: any;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
  {
    icon: Users,
    label: "Élèves",
    children: [
      { label: "Tous les élèves", href: "/dashboard/students" }
    ]
  },
  {
    icon: UserCircle,
    label: "Parents",
    children: [
      { label: "Liste des parents", href: "/dashboard/parents" },
    ]
  },
  {
    icon: GraduationCap,
    label: "Professeurs",
    children: [
      { label: "Liste des profs", href: "/dashboard/teachers" },
    ]
  },
  { icon: BookOpen, label: "Classes", href: "/dashboard/classes" },
  { icon: MapPin, label: "Salles", href: "/dashboard/rooms" },
  { icon: BookOpen, label: "Cours", href: "/dashboard/courses" },
  { icon: Calendar, label: "Emplois du temps", href: "/dashboard/schedule" },
  { icon: ClipboardCheck, label: "Présences", href: "/dashboard/attendance" },
  { icon: UserMinus, label: "Absences", href: "/dashboard/absences" },
  { icon: FileCheck, label: "Justificatifs", href: "/dashboard/absence-validation" },
  { icon: QrCode, label: "Scanner QR", href: "/dashboard/qr-scanner" },
  { icon: FileText, label: "Bulletins", href: "/dashboard/grades" },
  { icon: ClipboardList, label: "Devoirs", href: "/dashboard/assignments" },
  { icon: BarChart3, label: "Statistiques & Palmarès", href: "/dashboard/statistics" },
  { icon: Mail, label: "Messagerie", href: "/dashboard/messaging" },
  {
    icon: Wallet,
    label: "Finance (Synthese)",
    children: [
      { label: "Tableau de bord", href: "/dashboard/finance/dashboard" },
      { label: "Rapports & Exports", href: "/dashboard/finance/reports" },
    ]
  },
  { icon: Calendar, label: "Calendrier scolaire", href: "/dashboard/calendar" },
  { icon: Shield, label: "Utilisateurs", href: "/dashboard/users" },
  { icon: MessageSquare, label: "Aide & Support", href: "/dashboard/help" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
];

const teacherMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/teacher" },
  { icon: Users, label: "Mes Classes", href: "/teacher/classes" },
  { icon: ClipboardList, label: "Devoirs", href: "/teacher/assignments" },
  { icon: ClipboardList, label: "Corrections", href: "/teacher/corrections" },
  { icon: GraduationCap, label: "Compétences", href: "/teacher/competences" },
  { icon: FileText, label: "Notes", href: "/teacher/grades" },
  { icon: ClipboardCheck, label: "Présences", href: "/teacher/attendance" },
  { icon: Calendar, label: "Emploi du temps", href: "/teacher/schedule" },
  { icon: UserMinus, label: "Absences", href: "/teacher/absences" },
  { icon: Mail, label: "Messagerie", href: "/teacher/messaging" },
  { icon: MessageSquare, label: "Aide & Support", href: "/teacher/help" },
  { icon: Settings, label: "Paramètres", href: "/teacher/settings" },
];

const studentMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/student" },
  { icon: FileText, label: "Mes Notes", href: "/student/grades" },
  { icon: ClipboardList, label: "Mes Devoirs", href: "/student/assignments" },
  { icon: Calendar, label: "Emploi du temps", href: "/student/schedule" },
  { icon: ClipboardCheck, label: "Mes Présences", href: "/student/attendance" },
  { icon: GraduationCap, label: "Compétences", href: "/student/competences" },
  { icon: Wallet, label: "Frais Scolaires", href: "/student/fees" },
  { icon: Mail, label: "Messagerie", href: "/student/messaging" },
  { icon: Calendar, label: "Calendrier", href: "/student/calendar" },
  { icon: MessageSquare, label: "Aide & Support", href: "/student/help" },
  { icon: Settings, label: "Paramètres", href: "/student/settings" },
];

const parentMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/parent" },
  { icon: Users, label: "Mes Enfants", href: "/parent/children" },
  { icon: ClipboardList, label: "Devoirs", href: "/parent/assignments" },
  { icon: FileText, label: "Bulletins", href: "/parent/grades" },
  { icon: ClipboardCheck, label: "Présences", href: "/parent/attendance" },
  { icon: FileCheck, label: "Justificatifs", href: "/parent/absence-justification" },
  { icon: Wallet, label: "Frais Scolaires", href: "/parent/fees" },
  { icon: Mail, label: "Messagerie", href: "/parent/messaging" },
  { icon: Calendar, label: "Calendrier", href: "/parent/calendar" },
  { icon: MessageSquare, label: "Aide & Support", href: "/parent/help" },
  { icon: Settings, label: "Paramètres", href: "/parent/settings" },
];

const accountantMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/accountant" },
  {
    icon: Wallet,
    label: "Gestion Finance",
    children: [
      { label: "Tableau de bord", href: "/accountant/finance/dashboard" },
      { label: "Paiements élèves", href: "/accountant/finance/payments" },
      { label: "Dépenses école", href: "/accountant/finance/expenses" },
      { label: "Configuration frais", href: "/accountant/finance/fees" },
      { label: "Rapports & Exports", href: "/accountant/finance/reports" },
    ]
  },
  { icon: Mail, label: "Messagerie", href: "/accountant/messaging" },
  { icon: Settings, label: "Paramètres", href: "/accountant/settings" },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { badges } = useNavigationBadges();
  const { notifications, markAllAsRead } = useHelpNotifications();
  const { t } = useTranslation();

  const currentMenuItems = (() => {
    switch (user?.role) {
      case "admin": return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/dashboard" },
        {
          icon: Users,
          label: t("sidebar.students"),
          children: [
            { label: "Tous les élèves", href: "/dashboard/students" }
          ]
        },
        {
          icon: UserCircle,
          label: "Parents",
          children: [
            { label: "Liste des parents", href: "/dashboard/parents" },
          ]
        },
        {
          icon: GraduationCap,
          label: t("sidebar.teachers"),
          children: [
            { label: "Liste des profs", href: "/dashboard/teachers" },
          ]
        },
        { icon: BookOpen, label: t("sidebar.classes"), href: "/dashboard/classes" },
        { icon: MapPin, label: "Salles", href: "/dashboard/rooms" },
        { icon: BookOpen, label: "Cours", href: "/dashboard/courses" },
        { icon: Calendar, label: "Emplois du temps", href: "/dashboard/schedule" },
        { icon: ClipboardCheck, label: t("sidebar.attendance"), href: "/dashboard/attendance" },
        { icon: UserMinus, label: "Absences", href: "/dashboard/absences" },
        { icon: FileCheck, label: "Justificatifs", href: "/dashboard/absence-validation" },
        { icon: QrCode, label: "Scanner QR", href: "/dashboard/qr-scanner" },
        { icon: FileText, label: "Bulletins", href: "/dashboard/grades" },
        { icon: ClipboardList, label: t("sidebar.assignments"), href: "/dashboard/assignments" },
        { icon: BarChart3, label: "Statistiques & " + t("sidebar.palmares"), href: "/dashboard/statistics" },
        { icon: Mail, label: "Messagerie", href: "/dashboard/messaging" },
        {
          icon: Wallet,
          label: t("sidebar.finance") + " (Synthese)",
          children: [
            { label: t("finance.dashboard"), href: "/dashboard/finance/dashboard" },
            { label: "Rapports & Exports", href: "/dashboard/finance/reports" },
            { label: "Journal des écritures", href: "/dashboard/finance/journal" },
          ]
        },
        { icon: Calendar, label: "Calendrier scolaire", href: "/dashboard/calendar" },
        { icon: Shield, label: "Utilisateurs", href: "/dashboard/users" },
        { icon: MessageSquare, label: "Aide & Support", href: "/dashboard/help" },
        { icon: Archive, label: "Historique & Archive", href: "/dashboard/archive" },
        { icon: Settings, label: t("sidebar.settings"), href: "/dashboard/settings" },
      ];
      case "teacher": return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/teacher" },
        { icon: Users, label: "Mes Classes", href: "/teacher/classes" },
        { icon: ClipboardList, label: t("sidebar.assignments"), href: "/teacher/assignments" },
        { icon: ClipboardList, label: "Corrections", href: "/teacher/corrections" },
        { icon: GraduationCap, label: "Compétences", href: "/teacher/competences" },
        { icon: FileText, label: t("sidebar.grades"), href: "/teacher/grades" },
        { icon: Calendar, label: "Emploi du temps", href: "/teacher/schedule" },
        { icon: UserMinus, label: "Absences", href: "/teacher/absences" },
        { icon: Mail, label: "Messagerie", href: "/teacher/messaging" },
        { icon: Calendar, label: "Calendrier", href: "/teacher/calendar" },
        { icon: MessageSquare, label: "Aide & Support", href: "/teacher/help" },
        { icon: Archive, label: "Historique & Archive", href: "/teacher/archive" },
        { icon: Settings, label: t("sidebar.settings"), href: "/teacher/settings" },
      ];
      case "student": return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/student" },
        { icon: FileText, label: t("sidebar.grades"), href: "/student/grades" },
        { icon: ClipboardList, label: t("sidebar.assignments"), href: "/student/assignments" },
        { icon: Calendar, label: "Emploi du temps", href: "/student/schedule" },
        { icon: ClipboardCheck, label: t("sidebar.attendance"), href: "/student/attendance" },
        { icon: GraduationCap, label: "Compétences", href: "/student/competences" },
        { icon: Wallet, label: t("sidebar.finance"), href: "/student/fees" },
        { icon: Mail, label: "Messagerie", href: "/student/messaging" },
        { icon: Calendar, label: "Calendrier", href: "/student/calendar" },
        { icon: MessageSquare, label: "Aide & Support", href: "/student/help" },
        { icon: Archive, label: "Historique & Archive", href: "/student/archive" },
        { icon: Settings, label: t("sidebar.settings"), href: "/student/settings" },
      ];
      case "parent": return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/parent" },
        { icon: Users, label: "Mes Enfants", href: "/parent/children" },
        { icon: ClipboardList, label: t("sidebar.assignments"), href: "/parent/assignments" },
        { icon: FileText, label: "Bulletins", href: "/parent/grades" },
        { icon: ClipboardCheck, label: t("sidebar.attendance"), href: "/parent/attendance" },
        { icon: FileCheck, label: "Justificatifs", href: "/parent/absence-justification" },
        { icon: Wallet, label: t("sidebar.finance"), href: "/parent/fees" },
        { icon: Mail, label: "Messagerie", href: "/parent/messaging" },
        { icon: Calendar, label: "Calendrier", href: "/parent/calendar" },
        { icon: MessageSquare, label: "Aide & Support", href: "/parent/help" },
        { icon: Archive, label: "Historique & Archive", href: "/parent/archive" },
        { icon: Settings, label: t("sidebar.settings"), href: "/parent/settings" },
      ];
      case "accountant": return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/accountant" },
        {
          icon: Wallet,
          label: t("finance.payments"),
          children: [
            { label: t("finance.dashboard"), href: "/accountant/finance/dashboard" },
            { label: "Paiements élèves", href: "/accountant/finance/payments" },
            { label: "Dépenses école", href: "/accountant/finance/expenses" },
            { label: "Configuration frais", href: "/accountant/finance/fees" },
            { label: "Rapports & Exports", href: "/accountant/finance/reports" },
            { label: "Journal des écritures", href: "/accountant/finance/journal" },
          ]
        },
        { icon: Mail, label: "Messagerie", href: "/accountant/messaging" },
        { icon: Settings, label: t("sidebar.settings"), href: "/accountant/settings" },
      ];
      default: return [];
    }
  })();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleHelpClick = async (href: string) => {
    // Marquer toutes les notifications comme lues si c'est l'onglet Aide & Support
    if (href.includes('/help')) {
      await markAllAsRead();
    }
    navigate(href);
    onClose?.();
  };

  const getBadgeCount = (label: string) => {
    switch (label) {
      case "Messagerie": return badges.messages;
      case "Devoirs":
      case "Mes Devoirs": return badges.assignments;
      case "Bulletins":
      case "Notes":
      case "Mes Notes": return badges.grades;
      case "Frais Scolaires": return badges.fees;
      case "Corrections": return badges.corrections;
      case "Aide & Support": return notifications.unread;
      default: return 0;
    }
  };

  return (
    <aside className="h-full w-full border-r border-border bg-card shadow-lg lg:shadow-none">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Acadex App</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {currentMenuItems.map((item) => {
            if (item.children) {
              const isOpen = openMenus.includes(item.label);
              const isChildActive = item.children.some(c => location.pathname === c.href.split("?")[0]);
              return (
                <Collapsible key={item.label} open={isOpen || isChildActive}>
                  <CollapsibleTrigger
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isChildActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    {isOpen || isChildActive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1 pt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition-colors",
                          location.pathname === child.href.split("?")[0]
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
            const isActive = location.pathname === item.href;
            const isMessaging = item.label === "Messagerie";
            const isHelpSupport = item.label === "Aide & Support";
            return (
              <div
                key={item.href}
                onClick={() => isHelpSupport ? handleHelpClick(item.href!) : navigate(item.href!)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {getBadgeCount(item.label) > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center">
                    {getBadgeCount(item.label)}
                  </Badge>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <span className="text-sm font-medium">{user?.firstName?.[0] || "A"}{user?.lastName?.[0] || "D"}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{user?.firstName || "Admin"} {user?.lastName || ""}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || "Administrateur"}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
