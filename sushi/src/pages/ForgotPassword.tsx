/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiResetPassword } from "@/services/api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await apiResetPassword(email);
      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Email envoyé",
          description: result.message || "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <Card className="relative w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="mt-4 text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            {isSuccess 
              ? "Vérifiez votre boîte de réception"
              : "Entrez votre email pour réinitialiser votre mot de passe"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Un email a été envoyé à <strong className="text-foreground">{email}</strong> avec les instructions pour réinitialiser votre mot de passe.
                </p>
                <p className="text-xs text-muted-foreground">
                  Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier spam.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSuccess(false)}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Renvoyer l'email
                </Button>
                <Link to="/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@ecole.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Envoyer le lien de réinitialisation
                  </span>
                )}
              </Button>
              
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
