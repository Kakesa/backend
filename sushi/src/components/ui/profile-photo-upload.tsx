import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { updateProfilePhoto } from '@/services/api/profile.api';
import { cn } from '@/lib/utils';

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  userType: 'user' | 'student' | 'teacher' | 'parent';
  userId: string;
  userName?: string;
  onSuccess?: (photoUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhoto,
  userType,
  userId,
  userName,
  onSuccess,
  onError,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) {
      console.error('Aucun fichier sélectionné');
      return;
    }
    
    setPreview(null);
    setError(null);
    setSelectedFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload automatique
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const response = await updateProfilePhoto(userType, userId, file);
      
      if (response.success && response.data) {
        setPreview(null);
        onSuccess?.(response.data.photoUrl);
        
        // Réinitialiser l'input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        onError?.(response.message || 'Erreur lors du téléchargement');
      }
    } catch (error: any) {
      onError?.(error.message || 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Titre */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">Photo de profil</h3>
            <p className="text-sm text-muted-foreground">
              {userName ? `Mettre à jour la photo de ${userName}` : 'Mettre à jour votre photo de profil'}
            </p>
          </div>

          {/* Zone de téléchargement */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              'hover:border-primary hover:bg-primary/5 cursor-pointer'
            )}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            {/* Input caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            {/* Contenu */}
            <div className="space-y-4">
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>
                </div>
              ) : preview ? (
                <div className="space-y-2">
                  <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden">
                    <ProfileAvatar
                      src={currentPhoto}
                      alt={userName || 'Profile'}
                      userType={userType}
                      userId={userId}
                      size="lg"
                      showStatus={true}
                      status="online"
                    />
                    <Button
                      variant="destructive"
                      className="absolute top-0 right-0 h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPreview();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Cliquez pour changer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Glissez-déposez une image ici</p>
                    <p className="text-xs text-muted-foreground">ou cliquez pour parcourir</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formats acceptés: JPG, PNG, GIF, WebP</p>
            <p>• Taille maximale: 5MB</p>
            <p>• Image carrée recommandée</p>
          </div>

          {/* Boutons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={openFileDialog}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Parcourir
            </Button>
            
            {preview && (
              <Button
                onClick={() => {
                  const file = fileInputRef.current?.files?.[0];
                  if (file) handleUpload(file);
                }}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Téléchargement...' : 'Confirmer'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
