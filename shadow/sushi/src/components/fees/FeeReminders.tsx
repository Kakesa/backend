import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { apiSendFeeReminder } from "@/services/api/fees.api";
import { toast } from "sonner";

interface FeeReminder {
  id: string;
  studentFeeId: string;
  feeName: string;
  studentName: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  lastReminderDate?: string;
  reminderSent: boolean;
}

interface FeeRemindersProps {
  studentFees?: any[];
  onReminderSent?: () => void;
}

export default function FeeReminders({ studentFees, onReminderSent }: FeeRemindersProps) {
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [autoReminders, setAutoReminders] = useState(true);
  const [sendingReminders, setSendingReminders] = useState<string[]>([]);

  useEffect(() => {
    if (studentFees) {
      const feeReminders: FeeReminder[] = studentFees
        .filter((fee: any) => fee.balance > 0)
        .map((fee: any) => {
          const dueDate = fee.feeDefinitionId?.dueDate;
          if (!dueDate) return null;

          const daysUntilDue = Math.ceil(
            (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: fee.id,
            studentFeeId: fee.id,
            feeName: fee.feeDefinitionId?.name || 'Frais',
            studentName: fee.studentId?.firstName + ' ' + fee.studentId?.lastName || 'Élève',
            amount: fee.balance,
            dueDate,
            daysUntilDue,
            lastReminderDate: fee.lastReminderDate,
            reminderSent: !!fee.lastReminderDate
          };
        })
        .filter(Boolean);

      setReminders(feeReminders);
    }
  }, [studentFees]);

  const handleSendReminder = async (studentFeeId: string) => {
    try {
      setSendingReminders(prev => [...prev, studentFeeId]);
      await apiSendFeeReminder(studentFeeId);
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.studentFeeId === studentFeeId 
            ? { ...reminder, reminderSent: true, lastReminderDate: new Date().toISOString() }
            : reminder
        )
      );

      toast.success("Rappel envoyé avec succès");
      onReminderSent?.();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Erreur lors de l'envoi du rappel");
    } finally {
      setSendingReminders(prev => prev.filter(id => id !== studentFeeId));
    }
  };

  const getReminderStatus = (reminder: FeeReminder) => {
    if (reminder.daysUntilDue < 0) {
      return {
        status: "overdue",
        label: "En retard",
        color: "bg-red-100 text-red-800",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (reminder.daysUntilDue <= 7) {
      return {
        status: "urgent",
        label: "Urgent",
        color: "bg-orange-100 text-orange-800",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (reminder.daysUntilDue <= 30) {
      return {
        status: "soon",
        label: "Bientôt",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Calendar className="h-4 w-4" />
      };
    } else {
      return {
        status: "normal",
        label: "À venir",
        color: "bg-blue-100 text-blue-800",
        icon: <Calendar className="h-4 w-4" />
      };
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Rappels de Paiement
          </CardTitle>
          <CardDescription>
            Configurez les rappels automatiques pour les frais impayés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun rappel nécessaire</p>
            <p className="text-sm mt-2">Tous les frais sont en règle</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Rappels de Paiement
            </CardTitle>
            <CardDescription>
              {reminders.length} frais nécessitent votre attention
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-reminders" className="text-sm">
              Rappels auto
            </Label>
            <Switch
              id="auto-reminders"
              checked={autoReminders}
              onCheckedChange={setAutoReminders}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedReminders.map((reminder) => {
            const status = getReminderStatus(reminder);
            
            return (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${status.color}`}>
                    {status.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{reminder.feeName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {reminder.studentName} • {reminder.amount.toLocaleString()} $
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Échéance: {new Date(reminder.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                      {reminder.reminderSent && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Rappel envoyé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminder(reminder.studentFeeId)}
                  disabled={sendingReminders.includes(reminder.studentFeeId) || reminder.reminderSent}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                  {sendingReminders.includes(reminder.studentFeeId) ? (
                    "Envoi..."
                  ) : reminder.reminderSent ? (
                    "Déjà envoyé"
                  ) : (
                    "Envoyer rappel"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {autoReminders && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800">Rappels automatiques activés</p>
                <p className="text-blue-700">
                  Des rappels seront envoyés automatiquement 7 jours avant la date d'échéance,
                  puis tous les 3 jours jusqu'au paiement.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
