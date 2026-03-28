/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetStudentCourses } from "@/services/api/students.api";

const daysOfWeek = [
  { id: 0, name: "Dimanche" },
  { id: 1, name: "Lundi" },
  { id: 2, name: "Mardi" },
  { id: 3, name: "Mercredi" },
  { id: 4, name: "Jeudi" },
  { id: 5, name: "Vendredi" },
  { id: 6, name: "Samedi" },
];

const timeSlots = [
  "08:00 - 10:00",
  "10:15 - 12:15",
  "14:00 - 16:00",
  "16:15 - 18:15",
];

export default function StudentSchedule() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const studentId = user?.linkedId || "";

  useEffect(() => {
    const loadCourses = async () => {
      if (!studentId) return;
      setIsLoading(true);
      try {
        const data = await apiGetStudentCourses(studentId);
        setCourses(data);
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [studentId]);

  const getCourseForSlot = (dayId: number, timeSlot: string) => {
    const [start] = timeSlot.split(" - ");
    return courses.find(c => c.dayOfWeek === dayId && c.startTime.startsWith(start.substring(0, 5)));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      scientifique: "bg-blue-100 text-blue-800 border-blue-200",
      litteraire: "bg-purple-100 text-purple-800 border-purple-200",
      artistique: "bg-pink-100 text-pink-800 border-pink-200",
      sportif: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Emploi du Temps</h1>
        <p className="text-muted-foreground">Votre planning hebdomadaire de cours</p>
      </div>

      {/* Today's Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cours d'aujourd'hui - {daysOfWeek[today].name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {timeSlots.map((slot) => {
              const course = getCourseForSlot(today, slot);
              const subject = course?.subjectId;
              const teacher = course?.teacherId;

              return (
                <div
                  key={slot}
                  className={`p-4 rounded-lg border ${
                    course ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                  }`}
                >
                  <p className="text-sm font-medium text-muted-foreground mb-2">{slot}</p>
                  {course && subject ? (
                    <>
                      <p className="font-semibold text-foreground">{subject.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {course.room}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {teacher?.firstName} {teacher?.lastName}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Libre</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Planning Hebdomadaire</CardTitle>
          <CardDescription>Vue complète de votre semaine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-border p-2 bg-muted text-sm font-medium">Horaire</th>
                  {daysOfWeek.slice(1, 6).map((day) => (
                    <th
                      key={day.id}
                      className={`border border-border p-2 text-sm font-medium ${
                        day.id === today ? "bg-primary/10 text-primary" : "bg-muted"
                      }`}
                    >
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot}>
                    <td className="border border-border p-2 text-sm font-medium bg-muted/50">
                      {slot}
                    </td>
                    {daysOfWeek.slice(1, 6).map((day) => {
                      const course = getCourseForSlot(day.id, slot);
                      const subject = course?.subjectId;
                      const teacher = course?.teacherId;

                      return (
                        <td
                          key={`${day.id}-${slot}`}
                          className={`border border-border p-2 ${
                            day.id === today ? "bg-primary/5" : ""
                          }`}
                        >
                          {course && subject ? (
                            <div className={`p-2 rounded-md border ${getCategoryColor(subject.category || "scientifique")}`}>
                              <p className="font-medium text-sm">{subject.name}</p>
                              <p className="text-xs mt-1">{course.room}</p>
                              <p className="text-xs opacity-75">
                                {teacher?.lastName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
          <span className="text-sm text-muted-foreground">Scientifique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200"></div>
          <span className="text-sm text-muted-foreground">Littéraire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-100 border border-pink-200"></div>
          <span className="text-sm text-muted-foreground">Artistique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
          <span className="text-sm text-muted-foreground">Sportif</span>
        </div>
      </div>
    </div>
  );
}
