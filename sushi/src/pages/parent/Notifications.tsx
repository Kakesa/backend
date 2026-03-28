import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Calendar, MessageSquare, Check, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { useParentNotifications } from "@/hooks/useParentNotifications";
import { useAuth } from "@/contexts/AuthContext";

export default function ParentNotifications() {
  const { user } = useAuth();
  
  const {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useParentNotifications(user?.id || "");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note":
      case "grade":
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case "absence":
      case "attendance":
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "evenement":
      case "event":
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "note":
      case "grade":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Note</Badge>;
      case "absence":
      case "attendance":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Présence</Badge>;
      case "message":
        return <Badge variant="outline" className="border-green-500 text-green-500">Message</Badge>;
      case "evenement":
      case "event":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Événement</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  // Sort by date desc
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Toutes les notifications sont lues"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refreshNotifications()} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleSound} title={soundEnabled ? "Désactiver le son" : "Activer le son"}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <Check className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune notification</p>
            </CardContent>
          </Card>
        ) : (
          sortedNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={!notif.read ? "border-l-4 border-l-primary" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(notif.type)}
                    <div>
                      <CardTitle className={`text-base ${!notif.read ? "text-primary" : ""}`}>
                        {notif.studentName} - {notif.subjectName}
                      </CardTitle>
                      <CardDescription>
                        {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(notif.type)}
                    {!notif.read && (
                      <Badge variant="default" className="text-xs">Nouveau</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{notif.message}</p>
                {!notif.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markAsRead(notif.id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Marquer comme lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
