import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SchoolIsolationWarningProps {
  entityName?: string;
  show?: boolean;
  className?: string;
}

export function SchoolIsolationWarning({ 
  entityName = "cette ressource", 
  show = true,
  className 
}: SchoolIsolationWarningProps) {
  if (!show) return null;

  return (
    <Alert className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        <strong>Accès non autorisé :</strong> {entityName} n'appartient pas à votre établissement.
        Chaque école ne peut accéder qu'à ses propres données pour des raisons de sécurité.
      </AlertDescription>
    </Alert>
  );
}

export default SchoolIsolationWarning;
