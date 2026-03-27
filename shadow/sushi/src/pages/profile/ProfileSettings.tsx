import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfilePhotoUpload } from '@/components/ui/profile-photo-upload';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { Camera, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  
  const {
    isUploading,
    isDeleting,
    error,
    uploadPhoto,
    removePhoto,
    clearError
  } = useProfilePhoto({
    userType: user?.role === 'student' ? 'student' : 
              user?.role === 'teacher' ? 'teacher' : 
              user?.role === 'parent' ? 'parent' : 'user',
    userId: user?.linkedId || user?.id || '',
    currentPhoto: user?.avatarUrl
  });

  const handlePhotoUpdate = (photoUrl: string) => {
    // Mettre à jour l'utilisateur dans le contexte
    // TODO: Mettre à jour le contexte Auth
    setIsEditingPhoto(false);
  };

  const handlePhotoError = (errorMessage: string) => {
    console.error('Photo upload error:', errorMessage);
    clearError();
  };

  const getUserTypeLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Étudiant';
      case 'teacher': return 'Enseignant';
      case 'parent': return 'Parent';
      case 'admin': return 'Administrateur';
      case 'superadmin': return 'Super Admin';
      default: return 'Utilisateur';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-500';
      case 'teacher': return 'bg-green-500';
      case 'parent': return 'bg-purple-500';
      case 'admin': return 'bg-orange-500';
      case 'superadmin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo de profil */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Cliquez sur la photo pour la modifier
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <ProfileAvatar
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                userType={user.role === 'student' ? 'student' : 
                          user.role === 'teacher' ? 'teacher' : 
                          user.role === 'parent' ? 'parent' : 'user'}
                userId={user.linkedId || user.id}
                size="xl"
                editable={true}
                onEdit={() => setIsEditingPhoto(true)}
              />
              
              <Badge className={getRoleBadgeColor(user.role)}>
                {getUserTypeLabel(user.role)}
              </Badge>
            </CardContent>
          </Card>

          {/* Upload de photo */}
          {isEditingPhoto && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Modifier la photo</CardTitle>
                <CardDescription>
                  Téléchargez une nouvelle photo de profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilePhotoUpload
                  currentPhoto={user.avatarUrl}
                  userType={user.role === 'student' ? 'student' : 
                            user.role === 'teacher' ? 'teacher' : 
                            user.role === 'parent' ? 'parent' : 'user'}
                  userId={user.linkedId || user.id}
                  userName={`${user.firstName} ${user.lastName}`}
                  onSuccess={handlePhotoUpdate}
                  onError={handlePhotoError}
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingPhoto(false)}
                    disabled={isUploading}
                  >
                    Annuler
                  </Button>
                  {user.avatarUrl && (
                    <Button 
                      variant="destructive" 
                      onClick={removePhoto}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informations du profil */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Détails de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nom complet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prénom</label>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">{user.firstName || 'Non renseigné'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">{user.lastName || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                <div className="mt-1">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getUserTypeLabel(user.role)}
                  </Badge>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut du compte</label>
                <div className="mt-1">
                  <Badge className={user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>

              {/* Date de création */}
              {user.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membre depuis</label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Dernière connexion */}
              {user.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
