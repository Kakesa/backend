/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRegisterStudent, apiLogin, apiRegister } from "@/services/api/auth.api";
import type { UserRole } from "@/types";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  // ========================
  // LOGIN
  // ========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await apiLogin({ email, password });
      setIsLoading(false);

      const userData = result.user || (result as any).data;
      if (userData) {
        login(userData, result.token!);
        toast({ title: "Connexion réussie", description: `Bienvenue ${userData.name || userData.firstName || ""} !` });

        // 🔐 Vérifier si l'utilisateur doit changer son mot de passe
        if (userData.mustChangePassword) {
          navigate("/change-password");
          return;
        }

        // Vérifier si l'utilisateur a une école associée
        const hasSchool = !!userData.school || !!userData.schoolId;

        let redirectPath: string;
        if (userData.role === "superadmin") {
          redirectPath = "/superadmin";
        } else if (userData.role === "admin") {
          // Admin sans école -> configuration de l'école
          redirectPath = hasSchool ? "/dashboard" : "/admin/school-setup";
        } else {
          // Teacher, student, parent sans école -> rejoindre une école
          if (!hasSchool) {
            redirectPath = "/join-school";
          } else {
            redirectPath = {
              teacher: "/teacher",
              student: "/student",
              parent: "/parent",
              accountant: "/accountant",
            }[userData.role as string] || "/login";
          }
        }

        navigate(redirectPath);
      } else {
        toast({ title: "Erreur de connexion", description: (result as any).message || "Échec de connexion", variant: "destructive" });
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // ========================
  // REGISTER
  // ========================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const firstName = (document.getElementById("firstName") as HTMLInputElement).value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement).value;
    const registerEmail = (document.getElementById("registerEmail") as HTMLInputElement).value;
    const phone = (document.getElementById("phone") as HTMLInputElement).value;
    const registerPassword = (document.getElementById("registerPassword") as HTMLInputElement).value;

    try {
      if (selectedRole === "student") {
        // 🎓 Inscription spécifique élève
        await apiRegisterStudent({
          firstName,
          lastName,
          email: registerEmail,
          password: registerPassword,
          phone,
          dateOfBirth: "2010-01-01", // Valeur par défaut pour l'instant
          gender: "OTHER", // Valeur par défaut pour l'instant
        });
      } else {
        // 🏠 Inscription standard pour les autres rôles
        const body = {
          name: `${firstName} ${lastName}`,
          email: registerEmail,
          phone,
          password: registerPassword,
          role: selectedRole as UserRole,
        };
        await apiRegister(body);
      }

      setIsLoading(false);
      toast({ title: "Compte créé", description: "Un code d'activation a été envoyé à votre email." });
      // Rediriger vers la page d'activation avec l'email et le rôle pré-remplis
      navigate(`/activate-account?email=${encodeURIComponent(registerEmail)}&role=${selectedRole}`);
    } catch (err: any) {
      setIsLoading(false);
      toast({ title: "Erreur", description: err.message || "Échec de l'inscription", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="mt-4 text-2xl">Acadex App</CardTitle>
          <CardDescription>Système de gestion scolaire</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="nom@ecole.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Connexion..." : "Se connecter"}</Button>
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              </form>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" placeholder="Witness" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" placeholder="Kakesa" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input id="registerEmail" type="email" placeholder="nom@ecole.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" type="tel" placeholder="+243 828 863 897" required />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur (nouvelle école)</SelectItem>
                      <SelectItem value="teacher">Professeur</SelectItem>
                      <SelectItem value="student">Élève</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="accountant">Comptable</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedRole === "admin" && (
                    <p className="text-xs text-muted-foreground">
                      Vous serez redirigé vers la configuration de votre école après l'inscription.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Mot de passe</Label>
                  <div className="relative">
                    <Input id="registerPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Création..." : "Créer un compte"}</Button>
              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
