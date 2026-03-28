/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiJoinSchool } from "@/services/api/auth.api";
import { apiNotifyNewUserJoined } from "@/services/api/notifications-school.api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function JoinSchool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, login, token } = useAuth();
  
  const [schoolCode, setSchoolCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const role = searchParams.get("role") || user?.role || "student";

  const handleJoinSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schoolCode.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir le code de l'école", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiJoinSchool(schoolCode.toUpperCase());

      toast({ 
        title: "Félicitations !", 
        description: result.message || "Opération réussie avec succès ! Vous pouvez maintenant accéder à votre espace." 
      });

      // Mettre à jour l'utilisateur dans le contexte
      if (user) {
        // On fusionne les nouvelles infos d'école
        const updatedUser = { 
          ...user, 
          school: result.schoolId, 
          schoolId: result.schoolId,
          needsSchoolSetup: false 
        };
        login(updatedUser, token!);

        // Notification asynchrone (pas grave si ça échoue)
        apiNotifyNewUserJoined({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userRole: user.role,
          schoolId: result.schoolId,
          schoolName: result.schoolName || 'École',
          joinedAt: new Date().toISOString(),
        }).catch(err => console.warn('Notification failed:', err));
      }

      // Petite pause pour laisser le toast s'afficher
      setTimeout(() => {
        const userRole = user?.role || role;
        const redirectPath = {
          teacher: "/teacher",
          student: "/student",
          parent: "/parent",
          admin: "/dashboard",
        }[userRole as string] || "/student";

        navigate(redirectPath);
      }, 1500);
    } catch (err: any) {
      toast({ 
        title: "Échec de l'adhésion", 
        description: err.message || "Code école invalide ou impossible de contacter le serveur", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <School className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Rejoindre une école</CardTitle>
          <CardDescription>
            Entrez le code fourni par votre établissement pour rejoindre l'école
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleJoinSchool} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schoolCode">Code de l'école</Label>
              <Input
                id="schoolCode"
                type="text"
                placeholder="Ex: ABC123"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-widest uppercase"
                maxLength={12}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Ce code vous a été fourni par l'administrateur de l'école
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Rejoindre l'école
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous êtes administrateur ?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => navigate("/admin/school-setup")}
              >
                Créer une nouvelle école
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
