/* eslint-disable @typescript-eslint/no-explicit-any */
import { SharedCalendar } from "@/components/calendar/SharedCalendar";
import { useAuth } from "@/contexts/AuthContext";

export default function SharedCalendarPage() {
  const { user } = useAuth();
  
  // Determine the class of the user from their profile
  const classId = (user as any)?.classId || (user as any)?.linkedProfile?.classId;
  const userRole = (user?.role || "student") as "admin" | "teacher" | "student" | "parent";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendrier Scolaire</h1>
        <p className="text-muted-foreground">
          Consultez les événements, devoirs et échéances de l'année scolaire
        </p>
      </div>
      
      <SharedCalendar userRole={userRole} classId={classId} />
    </div>
  );
}
