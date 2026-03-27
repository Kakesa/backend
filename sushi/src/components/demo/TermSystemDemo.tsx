import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTermSystem } from '@/hooks/useTermSystem';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { Calendar, BookOpen, Users, Settings } from 'lucide-react';

export function TermSystemDemo() {
  const {
    termSystem,
    isTrimesterSystem,
    isSemesterSystem,
    periodCount,
    periodNames,
    systemName,
    systemDescription,
  } = useTermSystem();

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Système de Termes Adaptatif</h1>
        <p className="text-muted-foreground">
          Configuration automatique du système éducatif selon le type d'établissement
        </p>
      </div>

      {/* Carte d'information du système */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Actuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Type de système</p>
              <Badge className={isTrimesterSystem ? 'bg-green-500' : 'bg-blue-500'}>
                {systemName}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nombre de périodes</p>
              <p className="text-2xl font-bold">{periodCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Description</p>
            <p className="text-sm">{systemDescription}</p>
          </div>
        </CardContent>
      </Card>

      {/* Périodes disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Périodes Académiques
          </CardTitle>
          <CardDescription>
            Les périodes disponibles selon le système configuré
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {periodNames.map((periodName, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 text-center hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">{periodName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Période {index + 1}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle>Sélecteur de Période</CardTitle>
          <CardDescription>
            Composant adaptatif qui s'ajuste automatiquement au système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <PeriodSelector placeholder="Sélectionner une période" />
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Ce sélecteur affiche automatiquement 
              {isTrimesterSystem ? '3 trimestres' : '2 semestres'} 
              {' '}selon la configuration de l'établissement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impact sur les modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Impact sur les Modules
          </CardTitle>
          <CardDescription>
            Modules affectés par le changement de système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Modules académiques</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Génération de bulletins
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Calcul des moyennes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Saisie des notes
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Modules administratifs</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Rapports périodiques
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Exportations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Statistiques
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            📋 Instructions d'utilisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>
              1. Allez dans <strong>Paramètres → Général → Paramètres académiques</strong>
            </li>
            <li>
              2. Sélectionnez le système de termes souhaité (Trimestre ou Semestre)
            </li>
            <li>
              3. Confirmez le changement en lisant l'avertissement attentivement
            </li>
            <li>
              4. Tous les modules s'adapteront automatiquement au nouveau système
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
