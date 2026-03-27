import { Bell, BellOff, Check, CheckCheck, Mail, FileText, Calendar, Trash2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePushNotifications, PushNotification } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface PushNotificationCenterProps {
  userId: string;
  userRole: string;
}

const getNotificationIcon = (type: PushNotification["type"]) => {
  switch (type) {
    case "message":
      return <Mail className="h-4 w-4 text-blue-500" />;
    case "homework_reminder":
      return <FileText className="h-4 w-4 text-orange-500" />;
    case "grade":
      return <Check className="h-4 w-4 text-green-500" />;
    case "event":
      return <Calendar className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
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
  return `Il y a ${diffDays}j`;
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: PushNotification; 
  onMarkAsRead: (id: string) => void;
}) => (
  <div
    className={cn(
      "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
      !notification.read && "bg-primary/5"
    )}
    onClick={() => onMarkAsRead(notification.id)}
  >
    <div className="flex-shrink-0 mt-0.5">
      {getNotificationIcon(notification.type)}
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "text-sm",
        !notification.read && "font-medium"
      )}>
        {notification.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {notification.body}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {getTimeAgo(notification.createdAt)}
      </p>
    </div>
    {!notification.read && (
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
    )}
  </div>
);

export function PushNotificationCenter({ userId, userRole }: PushNotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    permission,
    soundEnabled,
    toggleSound,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = usePushNotifications(userId, userRole);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-1">
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
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={markAllAsRead}
                title="Tout marquer comme lu"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearNotifications}
                title="Effacer tout"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {permission !== "granted" && (
          <div className="p-4 bg-muted/50 border-b">
            <p className="text-sm text-muted-foreground mb-2">
              Activez les notifications pour ne rien manquer
            </p>
            <Button size="sm" onClick={requestPermission}>
              <Bell className="mr-2 h-4 w-4" />
              Activer
            </Button>
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
