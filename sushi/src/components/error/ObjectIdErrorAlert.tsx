import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';

interface ObjectIdErrorAlertProps {
  error: any;
  onRetry?: () => void;
  onCopySuggestedId?: (suggestedId: string) => void;
}

const ObjectIdErrorAlert: React.FC<ObjectIdErrorAlertProps> = ({
  error,
  onRetry,
  onCopySuggestedId,
}) => {
  if (!error?.isObjectIdError) {
    return null;
  }

  const handleCopySuggestedId = () => {
    if (error.suggestedCourseId && onCopySuggestedId) {
      onCopySuggestedId(error.suggestedCourseId);
    } else if (error.suggestedCourseId) {
      navigator.clipboard.writeText(error.suggestedCourseId);
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <div className="space-y-2">
        <AlertDescription className="font-medium text-orange-800">
          ⚠️ Erreur de format d'ID détectée
        </AlertDescription>
        
        <div className="text-sm text-orange-700 space-y-1">
          <p>
            <strong>ID invalide :</strong> <code className="bg-orange-100 px-1 rounded">{error.invalidCourseId}</code>
          </p>
          <p>
            <strong>ID suggéré :</strong> <code className="bg-green-100 px-1 rounded text-green-800">{error.suggestedCourseId}</code>
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {onCopySuggestedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySuggestedId}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copier l'ID suggéré
            </Button>
          )}
          
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Réessayer
            </Button>
          )}
        </div>

        <p className="text-xs text-orange-600 mt-2">
          Le système a automatiquement converti l'ID au format MongoDB ObjectId requis.
          Vous pouvez copier l'ID suggéré pour une utilisation future.
        </p>
      </div>
    </Alert>
  );
};

export default ObjectIdErrorAlert;
