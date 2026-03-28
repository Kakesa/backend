import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SharedCalendar } from "@/components/calendar";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { Class } from "@/types";

export default function SchoolCalendar() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(async () => {
    try {
      const classesData = await apiGetAllClasses();
      setClasses(classesData);
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendrier Scolaire</h1>
          <p className="text-muted-foreground">Consultez les événements et l'emploi du temps</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendrier principal avec SharedCalendar */}
      <Card>
        <CardContent className="p-0">
          <SharedCalendar 
            userRole="admin" 
            classId={selectedClass === "all" ? undefined : selectedClass}
          />
        </CardContent>
      </Card>
    </div>
  );
}
