/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, GraduationCap, Loader2, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiActivateAccount, apiResendOTP } from "@/services/api/auth.api";
// axios import removed as we now use api services

const OTP_EXPIRATION = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const emailFromUrl = searchParams.get('email') || '';
  const roleFromUrl = searchParams.get('role') || 'student';
  
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timer, setTimer] = useState(OTP_EXPIRATION);

  // Compte à rebours
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

 const activate = async () => {
  if (!email || !code) {
    toast({
      title: "Erreur",
      description: "Veuillez saisir email et code OTP",
      variant: "destructive",
    });
    return;
  }

  if (code.length !== 6) {
    toast({
      title: "Erreur",
      description: "Le code OTP doit contenir 6 chiffres",
      variant: "destructive",
    });
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    toast({
      title: "Erreur",
      description: "Nombre maximum de tentatives atteint. Renvoyez un nouveau code.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);

  try {
    const result = await apiActivateAccount(
      email.trim().toLowerCase(),
      code.trim()
    );

    toast({
      title: "Succès",
      description: "Compte activé avec succès 🎉",
    });

    if (result.token && result.user) {
      login(result.user, result.token);
    }

    setTimeout(() => {
      const userRole = result.user?.role;
      if (userRole === 'admin') {
        navigate('/admin/school-setup');
      } else {
        navigate(`/join-school?role=${userRole}`);
      }
    }, 1200);

  } catch (e: any) {
    setAttempts(prev => prev + 1);

    toast({
      title: "Erreur",
      description: e.message || e.response?.data?.message || "Code OTP incorrect",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const resend = async () => {
    if (!email) {
      toast({ title: "Erreur", description: "Veuillez saisir votre email", variant: "destructive" });
      return;
    }

    setResendLoading(true);
    try {
      await apiResendOTP(email);
      toast({ title: "Succès", description: "Nouveau code OTP envoyé par email" });
      setAttempts(0);
      setTimer(OTP_EXPIRATION);
      setCode('');
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.response?.data?.message || 'Impossible de renvoyer le code',
        variant: "destructive" 
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Mail className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Activation du compte</CardTitle>
          <CardDescription>
            Un code à 6 chiffres a été envoyé à votre adresse email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!emailFromUrl && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@ecole.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {emailFromUrl && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Code envoyé à <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <Label>Code OTP</Label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="text-center">
            <p className={`text-sm ${timer <= 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              ⏱ Temps restant : {formatTimer()}
            </p>
          </div>

          <Button
            onClick={activate}
            className="w-full"
            disabled={loading || attempts >= MAX_ATTEMPTS || timer <= 0 || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <GraduationCap className="mr-2 h-4 w-4" />
                Activer mon compte
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={resend}
              disabled={resendLoading}
              className="text-sm"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renvoyer le code OTP
                </>
              )}
            </Button>
          </div>

          {timer <= 0 && (
            <p className="text-center text-sm text-destructive">
              Le code a expiré. Veuillez en demander un nouveau.
            </p>
          )}

          {attempts >= MAX_ATTEMPTS && (
            <p className="text-center text-sm text-destructive">
              Trop de tentatives échouées. Veuillez demander un nouveau code.
            </p>
          )}

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full text-sm text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour pour modifier mon email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
