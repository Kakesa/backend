import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, GraduationCap, Building, CheckCircle, AlertCircle } from 'lucide-react';

export function SchoolSetupDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Configuration de l'École</h1>
        <p className="text-muted-foreground">
          Le système de termes est maintenant disponible dès la création de l'établissement
        </p>
      </div>

      {/* Carte de présentation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Nouvelle Fonctionnalité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Configuration du système de termes dès la création</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Adaptation automatique des bulletins et modules</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Interface intuitive avec descriptions claires</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de démonstration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Les informations de base de votre établissement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <div className="border rounded-md p-2 bg-muted">
                <span className="text-sm">École primaire</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Terme du système *</label>
              <div className="border rounded-md p-2 bg-primary/10 border-primary/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Trimestre (3 termes)</p>
                    <p className="text-xs text-muted-foreground">Adapté aux écoles primaires</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Année académique *</label>
              <div className="border rounded-md p-2 bg-muted">
                <span className="text-sm">2024-2025</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <div className="border rounded-md p-2 bg-muted">
                <span className="text-sm text-muted-foreground">Description de l'établissement...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Options de Système
          </CardTitle>
          <CardDescription>
            Les deux systèmes disponibles avec leurs caractéristiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Trimestre (3 termes)</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">3 périodes académiques</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Adapté aux écoles primaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Bulletin portrait DRC</span>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Par défaut
              </Badge>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Semestre (2 termes)</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">2 périodes académiques</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Adapté aux écoles secondaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Bulletin standard</span>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Secondaire
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact sur la création */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            📋 Impact sur la Création
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Le système est configuré dès la création de l'école</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Les bulletins s'adaptent automatiquement au choix</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Le choix peut être modifié ultérieurement dans les paramètres</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Tous les modules sont configurés automatiquement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Comment ça Marche</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Remplissez les informations générales de l'école</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Sélectionnez le type d'établissement</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Choisissez le système de termes adapté</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Configurez les coordonnées et validez</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>L'école est créée avec le système configuré automatiquement</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
