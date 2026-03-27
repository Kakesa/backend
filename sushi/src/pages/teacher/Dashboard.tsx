/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetMyTeacherProfile } from "@/services/api/teachers.api";
import { apiGetMySchedule } from "@/services/api/schedule.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  Loader2,
  Clock,
  MapPin,
  GraduationCap,
  FileCheck,
  ChevronRight
} from "lucide-react";


import { Link } from "react-router-dom";


const dayNames: Record<number, string> = {
  0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam"
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  const resolveId = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return String(val.id || val._id || "");
  };

  const teacherClasses = allClasses.filter(c => {
    const classId = resolveId(c);
    const mainTeacherId = resolveId(c.mainTeacherId);

    const isMainTeacher = (
      mainTeacherId === String(profile?.id || "") ||
      mainTeacherId === String(profile?._id || "") ||
      mainTeacherId === String(user?.linkedId || "")
    );

    const profileClassIds = (profile?.classes || []).map(resolveId);
    const isInTeacherClasses = profileClassIds.includes(classId);

    return isMainTeacher || isInTeacherClasses;
  });


  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, classesData, scheduleData, subjectsData] = await Promise.all([
          apiGetMyTeacherProfile(),
          apiGetAllClasses(),
          apiGetMySchedule(),
          apiGetAllSubjects(),
        ]);
        setProfile(profileData);
        setAllClasses(classesData);
        setSchedule(scheduleData);
        setSubjects(subjectsData);
      } catch (err) {
        console.error("Failed to load teacher dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }


  // Resolve subject names from profile.subjects (array of IDs or objects)
  const profileSubjectIds = (profile?.subjects || []).map((ps: any) => typeof ps === 'string' ? ps : (ps.id || ps._id));
  const teacherSubjects = subjects.filter(s => {
    const subjectId = s.id || s._id;
    return profileSubjectIds.includes(subjectId);
  });

  const totalStudents = teacherClasses.reduce((acc: number, cls: any) => acc + (cls.studentCount || 0), 0);

  const stats = [
    { label: "Mes Classes", value: teacherClasses.length, icon: Users, color: "bg-primary" },
    { label: "Mes Matières", value: teacherSubjects.length, icon: BookOpen, color: "bg-secondary" },
    { label: "Cours p./semaine", value: schedule.length, icon: Calendar, color: "bg-accent" },
    { label: "Total Élèves", value: totalStudents, icon: ClipboardList, color: "bg-muted" },
  ];

  const today = new Date().getDay();
  const todayClasses = schedule.filter((item: any) => item.dayOfWeek === today);
  // Trier par heure
  todayClasses.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

  // Helper for schedule item display
  const getScheduleSubjectName = (item: any) => {
    if (item.courseId?.subjectId?.name) return item.courseId.subjectId.name;
    if (item.subjectId?.name) return item.subjectId.name;
    if (item.subject?.name) return item.subject.name;
    return "Matière";
  };
  const getScheduleClassName = (item: any) => {
    if (item.courseId?.classId?.name) return item.courseId.classId.name;
    if (item.classId?.name) return item.classId.name;
    if (item.class?.name) return item.class?.name;
    return "Classe";
  };
  const getScheduleRoom = (item: any) => {
    return item.courseId?.room || item.room || item.roomId?.name || "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenue, {profile?.firstName || user?.firstName}</h1>
        <p className="text-muted-foreground">Voici un aperçu de votre activité</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Link to="/teacher/corrections" className="group">
          <Card className="h-full border-none shadow-sm hover:shadow-md transition-all bg-orange-50/50 hover:bg-orange-50 border-orange-100">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <FileCheck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold mb-1">Corrections</h3>
              <p className="text-sm text-muted-foreground mb-4">Vous avez des travaux en attente de notation.</p>
              <div className="flex items-center text-orange-600 font-medium text-sm">
                Accéder aux copies <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/teacher/assignments" className="group">
          <Card className="h-full border-none shadow-sm hover:shadow-md transition-all bg-blue-50/50 hover:bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-1">Nouveau Devoir</h3>
              <p className="text-sm text-muted-foreground mb-4">Créez une nouvelle activité pour vos classes.</p>
              <div className="flex items-center text-blue-600 font-medium text-sm">
                Lancer un TP/Devoir <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cours du jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cours du jour
            </CardTitle>
            <CardDescription>
              {dayNames[today]} — Vos cours d'aujourd'hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun cours aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((item: any, idx: number) => (
                  <div key={item._id || idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getScheduleSubjectName(item)}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {getScheduleClassName(item)}
                        </span>
                        {getScheduleRoom(item) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getScheduleRoom(item)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-semibold text-primary">{item.startTime}</p>
                      <p className="text-xs text-muted-foreground">{item.endTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes Matières */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Mes Matières
            </CardTitle>
            <CardDescription>Matières que vous enseignez</CardDescription>
          </CardHeader>
          <CardContent>
            {teacherSubjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune matière assignée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacherSubjects.map((subject: any) => (
                  <div key={subject.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">Coef. {subject.coefficient}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes Classes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes Classes
            </CardTitle>
            <CardDescription>Classes dont vous êtes responsable</CardDescription>
          </CardHeader>
          <CardContent>
            {teacherClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune classe assignée</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teacherClasses.map((cls: any) => (
                  <div key={cls._id || cls.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.level || "Niveau"} {cls.section && `• ${cls.section}`}</p>
                    </div>
                    <Badge variant="secondary">{cls.studentCount || 0} élèves</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
