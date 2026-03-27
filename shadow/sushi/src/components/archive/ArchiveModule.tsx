import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Archive, 
  Search, 
  FileText, 
  Download, 
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Filter,
  Eye,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getArchivedDocuments,
  searchArchivedDocuments,
  getStudentArchives,
  downloadArchivedDocument,
  viewArchivedDocument,
  getArchiveStats
} from "@/services/archiveService";

interface ArchiveModuleProps {
  userType: 'admin' | 'teacher' | 'student' | 'parent';
}

const ArchiveModule: React.FC<ArchiveModuleProps> = ({ userType }) => {
  const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  // Années académiques disponibles
  const academicYears = [
    '2024-2025',
    '2023-2024', 
    '2022-2023',
    '2021-2022',
    '2020-2021'
  ];

  // Classes disponibles selon le rôle
  const getAvailableClasses = () => {
    if (userType === 'admin' || userType === 'teacher') {
      return [
        '6ème A', '6ème B', '5ème A', '5ème B',
        '4ème A', '4ème B', '3ème A', '3ème B',
        '2nde A', '2nde B', '1ère A', '1ère B', 'Tle A', 'Tle B'
      ];
    }
    return [];
  };

  // Types de documents
  const documentTypes = [
    { value: 'all', label: 'Tous les documents' },
    { value: 'bulletin', label: 'Bulletins de notes' },
    { value: 'report', label: 'Rapports annuels' },
    { value: 'certificate', label: 'Certificats' },
    { value: 'transcript', label: 'Relevés de notes' },
    { value: 'other', label: 'Autres documents' }
  ];

  // Charger les documents depuis l'API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userType === 'admin' || userType === 'teacher') {
        if (searchTerm) {
          response = await searchArchivedDocuments(searchTerm, {
            class: selectedClass !== 'all' ? selectedClass : undefined,
            year: selectedYear !== 'all' ? selectedYear : undefined,
            type: selectedType !== 'all' ? selectedType : undefined
          });
        } else {
          response = await getArchivedDocuments({
            class: selectedClass !== 'all' ? selectedClass : undefined,
            year: selectedYear !== 'all' ? selectedYear : undefined,
            type: selectedType !== 'all' ? selectedType : undefined
          });
        }
      } else {
        // Pour student/parent, utiliser getArchivedDocuments (filtres automatiquement par l'utilisateur connecté)
        response = await getArchivedDocuments({
          year: selectedYear !== 'all' ? selectedYear : undefined,
          type: selectedType !== 'all' ? selectedType : undefined
        });
      }
      
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents archivés.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques (admin/teacher uniquement)
  const fetchStats = async () => {
    if (userType === 'admin' || userType === 'teacher') {
      try {
        const statsData = await getArchiveStats();
        setStats(statsData);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }
  };

  // Effet pour charger les données au montage et lors des changements de filtres
  useEffect(() => {
    fetchDocuments();
  }, [userType, selectedClass, selectedYear, selectedType, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, [userType]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || doc.className === selectedClass;
    const matchesYear = !selectedYear || doc.academicYear === selectedYear;
    const matchesType = !selectedType || selectedType === 'all' || doc.type === selectedType;
    
    return matchesSearch && matchesClass && matchesYear && matchesType;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'bulletin': return FileText;
      case 'report': return BookOpen;
      case 'certificate': return GraduationCap;
      case 'transcript': return FileText;
      default: return Archive;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'bulletin': return 'bg-blue-100 text-blue-800';
      case 'report': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      case 'transcript': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'bulletin': return 'Bulletin';
      case 'report': return 'Rapport';
      case 'certificate': return 'Certificat';
      case 'transcript': return 'Relevé';
      default: return 'Document';
    }
  };

  const handleDownload = async (document: ArchivedDocument) => {
    try {
      const blob = await downloadArchivedDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.fileName || `${document.title}.${document.type === 'bulletin' ? 'pdf' : 'doc'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement réussi",
        description: `${document.title} a été téléchargé avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive",
      });
    }
  };

  const handleView = async (document: ArchivedDocument) => {
    try {
      const fileUrl = await viewArchivedDocument(document.id);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors de la visualisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le document.",
        variant: "destructive",
      });
    }
  };

  if (userType === 'student' || userType === 'parent') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Historique & Archive</h2>
            <p className="text-muted-foreground">
              {userType === 'parent' ? 'Consultez les documents archivés de vos enfants' : 'Consultez vos documents archivés'}
            </p>
          </div>
        </div>

        {/* Filtres simplifiés pour élève/parent */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Année académique</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les années" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {academicYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de document</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Documents Archivés ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Chargement des documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucun document trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((document) => {
                  const Icon = getDocumentIcon(document.type);
                  return (
                    <div key={document.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{document.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getDocumentColor(document.type)}>
                                {getDocumentLabel(document.type)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {document.studentName} • {document.className}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {document.date}
                              </span>
                              <span>{document.academicYear}</span>
                              <span>{document.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(document)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(document)}
                            className="gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue pour Admin/Teacher avec filtres avancés
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
          <Archive className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Historique & Archive</h2>
          <p className="text-muted-foreground">
            {userType === 'admin' ? 'Gérez les archives de tous les élèves' : 'Consultez les archives de vos classes'}
          </p>
        </div>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h3 className="font-medium">Filtres de recherche</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Recherche (Nom/Prénom/Classe)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {getAvailableClasses().map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Année académique</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de document</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('');
                  setSelectedYear('');
                  setSelectedType('');
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bulletins</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.type === 'bulletin').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rapports</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.type === 'report').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificats</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.type === 'certificate').length}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <Archive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Documents Archivés ({filteredDocuments.length})
          </CardTitle>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Exporter la sélection
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Chargement des documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun document trouvé pour les critères sélectionnés</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => {
                const Icon = getDocumentIcon(document.type);
                return (
                  <div key={document.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{document.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getDocumentColor(document.type)}>
                              {getDocumentLabel(document.type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {document.studentName} • {document.className}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {document.date}
                            </span>
                            <span>{document.academicYear}</span>
                            <span>{document.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(document)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          className="gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchiveModule;
