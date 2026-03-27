import React from "react";
import { Bell, BellOff, Check, CheckCheck, Trash2, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useParentNotifications, GradeNotification } from "@/hooks/useParentNotifications";

interface ParentNotificationCenterProps {
  parentId: string;
}

const NotificationItem: React.FC<{
  notification: GradeNotification;
  onMarkRead: (id: string) => void;
}> = ({ notification, onMarkRead }) => {
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={cn(
        "p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-2 h-2 rounded-full mt-2 shrink-0",
          notification.read ? "bg-muted" : "bg-primary"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {notification.studentName}
            </span>
            <Badge variant={notification.grade >= 16 ? "default" : notification.grade >= 10 ? "secondary" : "destructive"} className="text-xs">
              {notification.grade}/20
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Nouvelle note en <span className="font-medium">{notification.subjectName}</span>
          </p>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
};

export const ParentNotificationCenter: React.FC<ParentNotificationCenterProps> = ({
  parentId,
}) => {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications,
  } = useParentNotifications(parentId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={refreshNotifications}
                title="Rafraîchir"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleSound}
                title={soundEnabled ? "Désactiver le son" : "Activer le son"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tout marquer lu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-destructive hover:text-destructive"
                onClick={clearNotifications}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Effacer tout
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
