/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  BookOpen,
  User,
  ExternalLink,
  Paperclip,
  Loader2
} from "lucide-react";
import { 
  apiGetAssignmentsByStudent, 
  apiGetStudentSubmission
} from "@/services/api/assignments.api";
import { apiGetParentById } from "@/services/api/parents.api";
import type { Assignment, AssignmentSubmission } from "@/types/assignment.types";

export default function ParentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});

  const fetchChildren = React.useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const parentData = await apiGetParentById(user.linkedId);
      if (parentData.children && parentData.children.length > 0) {
        setChildren(parentData.children);
        setSelectedChildId(parentData.children[0].id);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les enfants.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchAssignments = React.useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      const data = await apiGetAssignmentsByStudent(studentId);
      setAssignments(data);
      
      const subs: Record<string, AssignmentSubmission> = {};
      await Promise.all(data.map(async (a) => {
        try {
          const sub = await apiGetStudentSubmission(a.id, studentId);
          if (sub) subs[a.id] = sub;
        } catch (e) { }
      }));
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les devoirs.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAssignments(selectedChildId);
    }
  }, [selectedChildId, fetchAssignments]);

  const getStatusBadge = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    const isSubmitted = !!submission;
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now && !isSubmitted;

    if (submission) {
      if (submission.status === 'graded') {
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Noté: {submission.grade}/{assignment.maxPoints}</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-600"><CheckCircle2 className="h-3 w-3 mr-1" />Soumis</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />En retard</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />À rendre</Badge>;
  };

  if (loading && assignments.length === 0 && children.length === 0) {
     return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const pendingAssignments = assignments.filter(a => !submissions[a.id] && new Date(a.dueDate) >= new Date());
  const submittedAssignmentsList = assignments.filter(a => !!submissions[a.id]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suivi des Devoirs</h1>
          <p className="text-muted-foreground">Suivez les devoirs et résultats de vos enfants</p>
        </div>
        {children.length > 1 && (
          <div className="w-[200px]">
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un enfant" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName || child.name} {child.lastName || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enfant suivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
               <User className="h-5 w-5 text-muted-foreground" />
               <span className="font-bold">
                 {children.find(c => c.id === selectedChildId)?.firstName || children.find(c => c.id === selectedChildId)?.name}
               </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">À rendre</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{pendingAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne (Devoirs)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
               {(() => {
                  const graded = Object.values(submissions).filter(s => s.grade !== undefined && s.grade !== null);
                  if (graded.length === 0) return "-";
                  const total = graded.reduce((acc, s) => acc + (s.grade || 0), 0);
                  const maxTotal = graded.length * 20; // Assuming /20 mostly, or normalize
                  // Actually easier to just average the grades if they are all on same scale or normalize percentage
                  // Let's just show average
                  return (total / graded.length).toFixed(1) + "/20";
               })()}
             </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tous les devoirs</TabsTrigger>
          <TabsTrigger value="pending">À faire</TabsTrigger>
          <TabsTrigger value="submitted">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {assignments.map(assignment => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment} 
              submission={submissions[assignment.id]} 
              getStatusBadge={getStatusBadge}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
           {pendingAssignments.map(assignment => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment} 
              submission={submissions[assignment.id]} 
              getStatusBadge={getStatusBadge}
            />
          ))}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
           {submittedAssignmentsList.map(assignment => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment} 
              submission={submissions[assignment.id]} 
              getStatusBadge={getStatusBadge}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentCard({ assignment, submission, getStatusBadge }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{assignment.title}</h3>
              {getStatusBadge(assignment)}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
               <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {typeof assignment.courseId === 'object' ? assignment.courseId.name : 'Matière'}
               </span>
               <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Pour le {new Date(assignment.dueDate).toLocaleDateString()}
               </span>
            </div>
          </div>

          <div className="text-right">
             {submission?.grade !== undefined && submission.grade !== null ? (
               <div className="text-xl font-bold text-green-600">
                 {submission.grade}/{assignment.maxPoints}
               </div>
             ) : (
               <div className="text-sm text-muted-foreground">-/{assignment.maxPoints}</div>
             )}
          </div>
        </div>
        
        {/* Feedback Section */}
        {submission?.feedback && (
          <div className="mt-3 pt-3 border-t bg-muted/30 p-2 rounded">
            <p className="text-sm font-medium">Commentaire du professeur:</p>
            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
