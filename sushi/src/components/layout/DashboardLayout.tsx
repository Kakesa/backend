import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Bell, Search, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeDropdown } from "@/components/ui/theme-dropdown";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop: fixed, Mobile: overlay */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
        isSidebarOpen ? "block" : "hidden"
      )} onClick={() => setIsSidebarOpen(false)} />

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="relative w-48 sm:w-64 lg:w-96 hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                className="pl-10"
              />
            </div>

            {/* Avatar de profil */}
            <ProfileAvatar
              src={user?.avatarUrl}
              alt={`${user?.name} ${user?.firstName || ''} ${user?.lastName || ''}`}
              userType="user"
              userId={user?.id}
              size="md"
              showStatus={true}
              status="online"
            />
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative sm:hidden">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                3
              </span>
            </Button>
            <ThemeDropdown />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
