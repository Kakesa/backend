import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileMoneyProvider, MobileMoneyPayment } from "@/types/superadmin.types";
import { apiRenewSubscription } from "@/services/api/superadmin.api";

interface MobileMoneyPaymentFormProps {
  subscriptionPlan: "basic" | "standard" | "premium";
  amount: number;
  currency?: string;
  onPaymentComplete?: (payment: MobileMoneyPayment) => void;
}

const providers: { id: MobileMoneyProvider; name: string; logo: string }[] = [
  { id: "mpesa", name: "M-Pesa", logo: "🟢" },
  { id: "orange_money", name: "Orange Money", logo: "🟠" },
  { id: "airtel_money", name: "Airtel Money", logo: "🔴" },
  { id: "africell", name: "Africell Money", logo: "🔵" },
];

export function MobileMoneyPaymentForm({ 
  subscriptionPlan, 
  amount, 
  currency = "XOF",
  onPaymentComplete 
}: MobileMoneyPaymentFormProps) {
  const [provider, setProvider] = useState<MobileMoneyProvider | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provider || !phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (!/^(\+)?[0-9]{9,15}$/.test(phoneNumber.replace(/\s/g, ""))) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("pending");

    try {
      // Appel API réel pour le renouvellement d'abonnement
      const response = await apiRenewSubscription({
        plan: subscriptionPlan,
        provider: provider as string,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        amount,
        currency,
      });

      if (response.success) {
        const payment: MobileMoneyPayment = {
          id: `pay_${Date.now()}`,
          schoolId: "current_school_id",
          amount,
          currency,
          provider: provider as MobileMoneyProvider,
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          transactionId: response.transactionId || `TXN${Date.now()}`,
          status: "completed",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        setPaymentStatus("completed");
        toast({
          title: "Paiement réussi !",
          description: `Votre abonnement ${subscriptionPlan} a été activé.`,
        });
        
        onPaymentComplete?.(payment);
      } else {
        throw new Error(response.message || "Échec du paiement");
      }
    } catch (error: unknown) {
      setPaymentStatus("failed");
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast({
        title: "Échec du paiement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "basic": return "bg-muted text-muted-foreground";
      case "standard": return "bg-primary/10 text-primary";
      case "premium": return "bg-amber-500/10 text-amber-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="h-5 w-5" />
          Paiement Mobile Money
        </CardTitle>
        <CardDescription>
          Payez votre abonnement en toute sécurité
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStatus === "completed" ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Paiement confirmé !</h3>
            <p className="text-muted-foreground">
              Votre abonnement est maintenant actif.
            </p>
          </div>
        ) : paymentStatus === "failed" ? (
          <div className="text-center py-8 space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Échec du paiement</h3>
            <p className="text-muted-foreground">
              Veuillez vérifier vos informations et réessayer.
            </p>
            <Button onClick={() => setPaymentStatus("idle")}>
              Réessayer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Résumé de la commande */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge className={getPlanColor(subscriptionPlan)}>
                  {subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant</span>
                <span className="text-lg font-bold">
                  {formatAmount(amount)} {currency}
                </span>
              </div>
            </div>

            {/* Sélection du provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Opérateur Mobile Money</Label>
              <Select 
                value={provider} 
                onValueChange={(value) => setProvider(value as MobileMoneyProvider)}
                disabled={isProcessing}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Sélectionnez un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span>{p.logo}</span>
                        <span>{p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Numéro de téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Entrez le numéro associé à votre compte Mobile Money
              </p>
            </div>

            {/* État de traitement */}
            {paymentStatus === "pending" && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Paiement en cours...
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Validez la transaction sur votre téléphone
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de paiement */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isProcessing || !provider || !phoneNumber}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  Payer {formatAmount(amount)} {currency}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              En cliquant sur "Payer", vous acceptez nos conditions d'utilisation.
              Vos données sont sécurisées.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
