import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Search,
  Filter,
  Reply,
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from "lucide-react";
import { helpService, type HelpRequest, type HelpRequestFilters, type HelpRequestStats } from "@/services/helpService";

const HelpManagement: React.FC = () => {
  console.log('HelpManagement component rendu');
  
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [stats, setStats] = useState<HelpRequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    byType: {
      complaint: 0,
      feature: 0,
      bug: 0,
      question: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading help management data...');
        const [requestsData, statsData] = await Promise.all([
          helpService.getAllRequests({}),
          helpService.getStats()
        ]);
        
        console.log('Requests data:', requestsData);
        console.log('Stats data:', statsData);
        
        setRequests(requestsData.data);
        setStats(statsData);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Fonctions de gestion des demandes
  const updateStatus = async (requestId: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    try {
      const updatedRequest = await helpService.updateRequest(requestId, { status: newStatus });
      setRequests(prev => prev.map(req => 
        req.id === requestId ? updatedRequest : req
      ));
      
      // Mettre à jour les stats
      const statsData = await helpService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const validateRequest = async (requestId: string) => {
    try {
      const updatedRequest = await helpService.updateRequest(requestId, { 
        status: 'resolved',
        adminResponse: 'Votre demande a été validée et traitée avec succès. Nous vous remercions pour votre patience.'
      });

      setRequests(prev => prev.map(req => 
        req.id === requestId ? updatedRequest : req
      ));
      
      // Mettre à jour les stats
      const statsData = await helpService.getStats();
      setStats(statsData);
      
      setSelectedRequest(null);
      setIsViewingDetails(false);
    } catch (error) {
      console.error('Erreur validation demande:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const updatedRequest = await helpService.updateRequest(requestId, { 
        status: 'resolved',
        adminResponse: 'Votre demande a été examinée mais ne peut pas être traitée dans l\'état actuel. Nous vous invitons à consulter notre FAQ ou à reformuler votre demande avec plus de détails. Merci de votre compréhension.'
      });

      setRequests(prev => prev.map(req => 
        req.id === requestId ? updatedRequest : req
      ));
      
      // Mettre à jour les stats
      const statsData = await helpService.getStats();
      setStats(statsData);
      
      setSelectedRequest(null);
      setIsViewingDetails(false);
    } catch (error) {
      console.error('Erreur rejet demande:', error);
    }
  };

  const handleResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;
    
    try {
      const updatedRequest = await helpService.updateRequest(selectedRequest.id, {
        status: 'resolved',
        adminResponse: responseText
      });

      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id ? updatedRequest : req
      ));
      
      // Mettre à jour les stats
      const statsData = await helpService.getStats();
      setStats(statsData);
      
      setResponseText('');
      setSelectedRequest(null);
      setIsViewingDetails(false);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const viewDetails = (request: HelpRequest) => {
    setSelectedRequest(request);
    setIsViewingDetails(true);
    setResponseText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 acadex-primary rounded-lg flex items-center justify-center text-white">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Demandes</h2>
          <p className="text-muted-foreground">Consultez et traitez les demandes des utilisateurs</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Résolues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Chargement des demandes...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertCircle className="h-4 w-4" />
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {request.type}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {request.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground">{request.subject}</h4>
                    <p className="text-muted-foreground mt-1">{request.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{request.userName}</span>
                    <span>•</span>
                    <span>{request.userEmail}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => viewDetails(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => validateRequest(request.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectRequest(request.id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de détails et de réponse */}
      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Informations de la demande */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className="mt-1">
                    {selectedRequest.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge className="mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Utilisateur</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userEmail}</p>
                </div>
              </div>

              {/* Sujet et description */}
              <div>
                <Label className="text-sm font-medium">Sujet</Label>
                <p className="text-sm mt-1">{selectedRequest.subject}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1 text-muted-foreground">{selectedRequest.description}</p>
              </div>

              {/* Réponse existante */}
              {selectedRequest.adminResponse && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Réponse existante</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300">{selectedRequest.adminResponse}</p>
                </div>
              )}

              {/* Formulaire de réponse */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-3">
                  <Label htmlFor="response">Votre réponse</Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Rédigez votre réponse..."
                    rows={4}
                  />
                  
                  <div className="flex gap-2">
                    <Button onClick={handleResponse} disabled={!responseText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la réponse
                    </Button>
                    <Button variant="outline" onClick={() => validateRequest(selectedRequest.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                    <Button variant="destructive" onClick={() => rejectRequest(selectedRequest.id)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button variant="ghost" onClick={() => setIsViewingDetails(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpManagement;
