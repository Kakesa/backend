import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, EyeOff, GraduationCap, Users, Shield, User } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    school: "",
    phone: "",
    agreeTerms: false,
    newsletter: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation basique
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role) {
      alert("Veuillez remplir tous les champs obligatoires");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      alert("Veuillez accepter les conditions d'utilisation");
      setIsLoading(false);
      return;
    }

    // Simulation d'inscription
    setTimeout(() => {
      alert("Inscription réussie ! Vous allez être redirigé vers la page de connexion.");
      navigate("/login");
    }, 2000);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const roleIcons = {
    admin: Shield,
    teacher: GraduationCap,
    parent: Users,
    student: User
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 acadex-primary rounded-lg flex items-center justify-center text-white shadow-lg">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Créer votre compte ACADEX
          </h1>
          <p className="text-gray-600">
            Rejoignez la plateforme éducative de demain
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jean.dupont@email.com"
                  required
                />
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              {/* Rôle */}
              <div>
                <Label htmlFor="role">Vous êtes *</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Administrateur
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Enseignant
                      </div>
                    </SelectItem>
                    <SelectItem value="parent">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Parent
                      </div>
                    </SelectItem>
                    <SelectItem value="student">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Élève
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Établissement (pour admin/teacher) */}
              {(formData.role === "admin" || formData.role === "teacher") && (
                <div>
                  <Label htmlFor="school">Nom de l'établissement *</Label>
                  <Input
                    id="school"
                    type="text"
                    value={formData.school}
                    onChange={(e) => handleChange("school", e.target.value)}
                    placeholder="Lycée Jean Jaurès"
                    required={formData.role === "admin" || formData.role === "teacher"}
                  />
                </div>
              )}

              {/* Mot de passe */}
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleChange("agreeTerms", checked)}
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline">
                      conditions d'utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline">
                      politique de confidentialité
                    </Link>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => handleChange("newsletter", checked)}
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    Je souhaite recevoir la newsletter ACADEX
                  </Label>
                </div>
              </div>

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                className="w-full acadex-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? "Inscription en cours..." : "Créer mon compte"}
              </Button>
            </form>

            {/* Lien vers connexion */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
