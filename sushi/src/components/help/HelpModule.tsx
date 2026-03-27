/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Send, CheckCircle, MessageSquare, Lightbulb, AlertTriangle, HelpCircle, BookOpen } from "lucide-react";
import { helpService, type HelpRequest, type CreateHelpRequest } from "@/services/helpService";
import { HelpFAQ } from "./HelpFAQ";

interface HelpModuleProps {
  userType: 'admin' | 'teacher' | 'student' | 'parent';
}

const HelpModule: React.FC<HelpModuleProps> = ({ userType }) => {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les demandes existantes
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await helpService.getMyRequests();
        setRequests(data);
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

  const requestTypes = [
    { value: 'complaint', label: 'Plainte', icon: AlertTriangle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    { value: 'feature', label: 'Suggestion de fonctionnalité', icon: Lightbulb, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'bug', label: 'Rapport de bug', icon: AlertCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    { value: 'question', label: 'Question', icon: MessageSquare, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.subject || !formData.description) return;

    setIsSubmitting(true);
    
    try {
      const newRequest = await helpService.createRequest({
        type: formData.type as any,
        subject: formData.subject,
        description: formData.description
      });

      setRequests([newRequest, ...requests]);
      setFormData({ type: '', subject: '', description: '' });
    } catch (error) {
      console.error('Erreur création demande:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeInfo = (type: string) => {
    return requestTypes.find(t => t.value === type) || requestTypes[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in-progress': return 'En cours';
      case 'resolved': return 'Résolu';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="w-12 h-12 acadex-primary rounded-lg flex items-center justify-center text-white flex-shrink-0">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-foreground">Centre d'Aide & Support</h2>
          <p className="text-muted-foreground">Trouvez de l'aide rapide ou contactez notre équipe de support</p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2">
          <TabsTrigger value="faq" className="flex items-center gap-2 text-sm sm:text-base">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
            <span className="sm:hidden">Aide</span>
          </TabsTrigger>
          <TabsTrigger value="new-request" className="flex items-center gap-2 text-sm sm:text-base">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle demande</span>
            <span className="sm:hidden">Créer</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-sm sm:text-base">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Mes demandes</span>
            <span className="sm:hidden">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <HelpFAQ />
        </TabsContent>

        {/* Onglet Nouvelle demande */}
        <TabsContent value="new-request" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Nouvelle demande d'aide</span>
                <span className="sm:hidden">Nouvelle demande</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="type">Type de demande</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type de demande" />
                      </SelectTrigger>
                      <SelectContent>
                        {requestTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              <span className="text-sm">{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Décrivez brièvement votre demande..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Fournissez tous les détails nécessaires pour traiter votre demande..."
                    rows={5}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="acadex-primary text-white w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="hidden sm:inline">Historique de mes demandes</span>
                <span className="sm:hidden">Mes demandes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Chargement de vos demandes...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Aucune demande envoyée pour le moment</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {/* TODO: Switch to new request tab */}}
                  >
                    Envoyer ma première demande
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const typeInfo = getTypeInfo(request.type);
                    return (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <typeInfo.icon className="h-4 w-4" />
                            <Badge className={`${typeInfo.color} text-xs`}>
                              {typeInfo.label}
                            </Badge>
                            <Badge className={`${getStatusColor(request.status)} text-xs`}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base">{request.subject}</h4>
                          <p className="text-muted-foreground text-sm">{request.description}</p>
                        </div>

                        {request.adminResponse && (
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-800 dark:text-green-200 text-sm">Réponse d'ACADEX</span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">{request.adminResponse}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpModule;
