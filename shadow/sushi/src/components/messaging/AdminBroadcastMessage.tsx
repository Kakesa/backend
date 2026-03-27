import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Check, AlertCircle } from "lucide-react";
import {
  apiSendMessageToAllParents,
  apiSendMessageToAllTeachers,
  apiSendMessageToAllStudents,
} from "@/services/api/messages.api";
import { useToast } from "@/hooks/use-toast";

interface AdminBroadcastMessageProps {
  currentUserId: string;
  currentUserName: string;
  schoolId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AdminBroadcastMessage({
  currentUserId,
  currentUserName,
  schoolId,
  isOpen = true,
  onOpenChange,
}: AdminBroadcastMessageProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientRole, setRecipientRole] = useState<"parent" | "teacher" | "student">("parent");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();

  const recipientRoleLabels: Record<string, string> = {
    parent: "Tous les parents",
    teacher: "Tous les professeurs",
    student: "Tous les élèves",
  };

  const handleSendClick = () => {
    if (!subject.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un sujet.",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer le contenu du message.",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleSendConfirmed = async () => {
    setLoading(true);
    setShowConfirmation(false);

    try {
      let result;
      
      // Appeler la bonne API selon le rôle destinataire
      if (recipientRole === "parent") {
        result = await apiSendMessageToAllParents(currentUserId, schoolId, {
          subject: subject.trim(),
          content: content.trim(),
        });
      } else if (recipientRole === "teacher") {
        result = await apiSendMessageToAllTeachers(currentUserId, schoolId, {
          subject: subject.trim(),
          content: content.trim(),
        });
      } else if (recipientRole === "student") {
        result = await apiSendMessageToAllStudents(currentUserId, schoolId, {
          subject: subject.trim(),
          content: content.trim(),
        });
      } else {
        throw new Error("Rôle destinataire invalide");
      }

      setSuccess(true);
      setSuccessMessage(
        `Message envoyé avec succès à ${result.sentTo} ${recipientRoleLabels[recipientRole].toLowerCase()}`
      );

      // Réinitialiser le formulaire
      setTimeout(() => {
        setSubject("");
        setContent("");
        setRecipientRole("parent");
        setSuccess(false);
      }, 3000);

      toast({
        title: "Succès",
        description: `Message envoyé à ${result.sentTo} destinataires (${result.messageCount} messages créés)`,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message en masse.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && onOpenChange) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Send className="h-5 w-5" />
              Message à une catégorie d'utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection du rôle destinataire */}
            <div className="space-y-2">
              <Label htmlFor="recipient-role" className="text-sm font-medium">
                Envoyer à :
              </Label>
              <Select value={recipientRole} onValueChange={(value: "parent" | "teacher" | "student") => setRecipientRole(value)}>
                <SelectTrigger id="recipient-role" className="w-full">
                  <SelectValue placeholder="Sélectionner les destinataires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Tous les parents</SelectItem>
                  <SelectItem value="teacher">Tous les professeurs</SelectItem>
                  <SelectItem value="student">Tous les élèves</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le message sera envoyé à tous les {recipientRoleLabels[recipientRole].toLowerCase()}.
              </p>
            </div>

            {/* Sujet */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Sujet
              </Label>
              <Input
                id="subject"
                placeholder="Ex: Fermeture de l'école le 25 décembre"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Contenu */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Message
              </Label>
              <Textarea
                id="content"
                placeholder="Entrez le contenu du message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {content.length} caractères
              </p>
            </div>

            {/* Bouton d'envoi */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSendClick}
                disabled={loading || !subject.trim() || !content.trim()}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </div>

            {/* Message de succès */}
            {success && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info box */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 space-y-3">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-amber-900">
                <p className="font-medium">Points importants :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Le message sera envoyé immédiatement à tous les destinataires</li>
                  <li>Chaque destinataire recevra un message personnalisé dans sa boîte de réception</li>
                  <li>Le message s'affichera comme étant venu de l'administration</li>
                  <li>Vous ne pouvez pas modifier ou récupérer le message après l'envoi</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'envoi du message</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>Vous êtes sur le point d'envoyer un message à :</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {recipientRoleLabels[recipientRole]}
                  </Badge>
                </div>
                <div className="bg-muted rounded p-3 space-y-2 text-left">
                  <p className="text-sm">
                    <strong>Sujet :</strong> {subject}
                  </p>
                  <p className="text-sm">
                    <strong>Message :</strong> {content.substring(0, 100)}
                    {content.length > 100 ? "..." : ""}
                  </p>
                </div>
              </div>
              <p className="text-amber-700 font-medium">
                Cette action ne peut pas être annulée.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendConfirmed}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Confirmer l'envoi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
