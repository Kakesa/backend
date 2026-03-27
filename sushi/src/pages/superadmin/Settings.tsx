import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SuperAdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configuration globale de la plateforme</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Gérer les notifications automatiques</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Rappels d'expiration</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alertes de paiement</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Abonnements</CardTitle>
            <CardDescription>Paramètres des abonnements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Durée période d'essai (jours)</Label>
              <Input type="number" defaultValue={14} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Suspension auto à expiration</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
      <Button onClick={() => toast.success("Paramètres sauvegardés")}>Sauvegarder</Button>
    </div>
  );
}
