/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/lib/passwordValidation";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users as UsersIcon, Camera, User, Calendar } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProfilePhotoUpload } from "@/components/ui/profile-photo-upload";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";

export default function TeacherSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const teacher = (user as any)?.linkedProfile || user;

  // Profile photo management
  const {
    isUploading,
    isDeleting,
    error: photoError,
    uploadPhoto,
    removePhoto,
    clearError
  } = useProfilePhoto({
    userType: 'teacher',
    userId: user?.id || '', // Utiliser l'ID user principal
    currentPhoto: user?.avatarUrl
  });

  const handlePhotoUpdate = (photoUrl: string) => {
    setIsEditingPhoto(false);
    toast({
      title: "Photo mise à jour",
      description: "Votre photo de profil a été mise à jour avec succès.",
    });
  };

  const handlePhotoError = (errorMessage: string) => {
    console.error('Photo upload error:', errorMessage);
    clearError();
    toast({
      title: "Erreur",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos informations ont été mises à jour.",
    });
  };

  const handleChangePassword = () => {
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast({
        title: "Mot de passe invalide",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été changé avec succès.",
    });
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et professionnelles</p>
      </div>

      {/* Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo de profil
          </CardTitle>
          <CardDescription>
            Cliquez sur la photo pour la modifier
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <ProfileAvatar
            src={user?.avatarUrl}
            alt={`${user?.firstName} ${user?.lastName}`}
            userType="teacher"
            userId={user?.linkedId}
            size="xl"
            editable={true}
            onEdit={() => setIsEditingPhoto(true)}
          />
          
          <Badge className="bg-green-500">
            Enseignant
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
              currentPhoto={user?.avatarUrl}
              userType="teacher"
              userId={user?.linkedId || ''}
              userName={`${user?.firstName} ${user?.lastName}`}
              onSuccess={handlePhotoUpdate}
              onError={handlePhotoError}
            />
            
            {photoError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{photoError}</p>
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
              {user?.avatarUrl && (
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos informations de profil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input id="matricule" value={teacher?.matricule || "N/A"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={teacher?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" defaultValue={teacher?.firstName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" defaultValue={teacher?.lastName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" defaultValue={teacher?.phone || ""} />
              </div>
            </div>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Infos Professionnelles</CardTitle>
            <CardDescription>Vos affectations (Lecture seule)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                Matières enseignées
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher?.subjects && teacher.subjects.length > 0 ? (
                  teacher.subjects.map((s: any) => (
                    <Badge key={s.id || s._id || s} variant="secondary">
                      {typeof s === 'object' ? s.name : s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Aucune matière assignée</span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UsersIcon className="h-4 w-4 text-primary" />
                Classes assignées
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher?.classes && teacher.classes.length > 0 ? (
                  teacher.classes.map((c: any) => (
                    <Badge key={c.id || c._id || c} variant="outline">
                      {typeof c === 'object' ? c.name : c}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Aucune classe assignée</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Modifiez votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <PasswordInput id="currentPassword" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <PasswordInput 
                id="newPassword" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showValidation 
                showStrength 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <PasswordInput 
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword}>Changer le mot de passe</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
