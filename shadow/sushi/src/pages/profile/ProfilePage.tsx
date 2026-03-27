import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfilePhotoUpload } from '@/components/ui/profile-photo-upload';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { Camera, User, Mail, Phone, Calendar, MapPin, Settings, Shield, Bell, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Préférences utilisateur simulées
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'fr',
    twoFactorAuth: false
  });
  
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

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
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
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres du profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <User className="inline-block h-4 w-4 mr-2" />
                  Profil
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'security' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Shield className="inline-block h-4 w-4 mr-2" />
                  Sécurité
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'preferences' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Settings className="inline-block h-4 w-4 mr-2" />
                  Préférences
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'notifications' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Bell className="inline-block h-4 w-4 mr-2" />
                  Notifications
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tab: Profil */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Photo de profil */}
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
                <Card>
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

              {/* Informations du profil */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Détails de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nom complet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Prénom</Label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">{user.firstName || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">{user.lastName || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  {/* Rôle et statut */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
                      <div className="mt-1">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getUserTypeLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statut du compte</Label>
                      <div className="mt-1">
                        <Badge className={user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {user.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  {user.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Membre depuis</Label>
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

                  {user.lastLogin && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dernière connexion</Label>
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
          )}

          {/* Tab: Sécurité */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Authentification à deux facteurs</h4>
                    <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <Switch 
                    checked={preferences.twoFactorAuth}
                    onCheckedChange={(checked) => handlePreferenceChange('twoFactorAuth', checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Voir l'historique des connexions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Préférences */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>
                  Personnalisez votre expérience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Mode sombre</h4>
                    <p className="text-sm text-muted-foreground">Utilisez le thème sombre</p>
                  </div>
                  <Switch 
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Langue</h4>
                    <p className="text-sm text-muted-foreground">Choisissez votre langue préférée</p>
                  </div>
                  <select 
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="px-3 py-1 rounded-md border border-input bg-background"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Gérez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications par email</h4>
                    <p className="text-sm text-muted-foreground">Recevez les notifications par email</p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications push</h4>
                    <p className="text-sm text-muted-foreground">Recevez les notifications push dans le navigateur</p>
                  </div>
                  <Switch 
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
