/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Building, MapPin, Upload, X, Loader2, Copy, Check, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetCurrentSchool } from "@/services/api/schools.api";
import { setCurrentSchool } from "@/data/schoolData";
import type { School } from "@/types/school.types";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SchoolSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "Congo",
    phone: "",
    email: "",
    website: "",
    academicYear: "2024-2025",
    type: "secondary",
    termSystem: "trimester",
    description: "",
    logo: null as File | null,
    logoPreview: ""
  });

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast({ title: "Erreur", description: "Fichier non valide", variant: "destructive" });
    }
    const reader = new FileReader();
    reader.onload = (ev) => handleChange("logoPreview", ev.target?.result);
    reader.readAsDataURL(file);
    handleChange("logo", file);
  };

  const removeLogo = () => {
    handleChange("logo", null);
    handleChange("logoPreview", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copySchoolCode = async () => {
    if (schoolCode) {
      await navigator.clipboard.writeText(schoolCode);
      setCopied(true);
      toast({ title: "Copié", description: "Le code école a été copié dans le presse-papier" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("address", formData.address);
      form.append("city", formData.city);
      form.append("country", formData.country);
      form.append("phone", formData.phone);
      form.append("email", formData.email);
      form.append("website", formData.website);
      form.append("academicYear", formData.academicYear);
      form.append("type", formData.type);
      form.append("termSystem", formData.termSystem);
      form.append("description", formData.description);

      if (formData.logo) {
        form.append("logo", formData.logo);
      }

      const res = await axios.post(
        `${API_URL}/schools`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );


      const data = res.data.data || res.data;
      
      // Récupérer le code école depuis la réponse
      if (data.code || data.schoolCode) {
        setSchoolCode(data.code || data.schoolCode);
      }

      // Mettre à jour l'utilisateur dans le contexte avec la nouvelle école
      if (user && data.school) {
        const updatedUser = { 
          ...user, 
          school: data.school._id || data.school.id,
          role: 'admin' as const,
          needsSchoolSetup: false
        };
        login(updatedUser, token!);

        // Définir l'école actuelle dans le système d'isolation
        const schoolData: School = {
          id: data.school._id || data.school.id,
          name: formData.name,
          code: data.code || data.schoolCode,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          country: formData.country,
          city: formData.city,
          types: formData.type,
          academicYear: formData.academicYear,
          createdAt: new Date().toISOString(),
          status: "active",
          settings: {
            gradeScale: 20,
            trimesters: formData.termSystem === 'semester' ? 2 : 3,
            termSystem: formData.termSystem,
            language: "fr",
            currency: "XOF",
            timezone: "Africa/Kinshasa",
          }
        };
        setCurrentSchool(schoolData);
      }

      toast({ 
        title: "École créée", 
        description: data.schoolCode 
          ? `Code école: ${data.schoolCode}. Partagez ce code avec vos enseignants et élèves.`
          : "Votre école a été créée avec succès."
      });

      // Si on a un code, on affiche la modal, sinon on redirige directement
      if (!data.code && !data.schoolCode) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      toast({ title: "Erreur", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = async () => {
    // S'assurer que l'école actuelle est bien définie avant de rediriger
    try {
      const currentSchoolData = await apiGetCurrentSchool();
      if (currentSchoolData) {
        setCurrentSchool(currentSchoolData);
        console.log('✅ École actuelle définie:', currentSchoolData.name);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'école:', error);
    }
    
    navigate("/dashboard");
  };

  // Si on a un code école, afficher l'écran de succès
  if (schoolCode) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">École créée avec succès !</CardTitle>
            <CardDescription>
              Partagez ce code avec vos enseignants, élèves et parents pour qu'ils puissent rejoindre votre école.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Code de l'école</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-bold tracking-widest">{schoolCode}</span>
                <Button variant="ghost" size="icon" onClick={copySchoolCode}>
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Les utilisateurs pourront utiliser ce code lors de leur inscription pour rejoindre automatiquement votre école.
            </p>

            <Button onClick={goToDashboard} className="w-full">
              Accéder au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Configuration de l'école</h1>
          <p className="mt-2 text-muted-foreground">Configurez les informations de votre établissement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5"/> Informations générales
              </CardTitle>
              <CardDescription>Les informations de base de votre établissement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  {formData.logoPreview ? (
                    <AvatarImage src={formData.logoPreview} />
                  ) : (
                    <AvatarFallback className="rounded-lg bg-muted">
                      <GraduationCap className="h-8 w-8 text-muted-foreground"/>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-2">
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={()=>fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2"/>
                      {formData.logoPreview ? "Changer" : "Télécharger"}
                    </Button>
                    {formData.logoPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                        <X className="h-4 w-4 mr-1"/>Supprimer
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Max 5 Mo.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nom de l'établissement *</Label>
                <Input value={formData.name} onChange={e => handleChange("name", e.target.value)} required placeholder="Entrez le nom de l'établissement"/>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
                    <SelectTrigger><SelectValue placeholder="Type"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">École primaire</SelectItem>
                      <SelectItem value="secondary">Collège / Lycée</SelectItem>
                      <SelectItem value="highschool">Lycée</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                      <SelectItem value="university">Université</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Terme du système *</Label>
                  <Select value={formData.termSystem} onValueChange={v => handleChange("termSystem", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le système" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimester">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Trimestre (3 termes)</p>
                            <p className="text-xs text-muted-foreground">Adapté aux écoles primaires</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="semester">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Semestre (2 termes)</p>
                            <p className="text-xs text-muted-foreground">Adapté aux écoles secondaires</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Année académique *</Label>
                  <Select value={formData.academicYear} onValueChange={v => handleChange("academicYear", v)}>
                    <SelectTrigger><SelectValue placeholder="Année académique"/></SelectTrigger>
                    <SelectContent>{academicYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => handleChange("description", e.target.value)} rows={3}/>
              </div>
            </CardContent>
          </Card>

          {/* Coordonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Adresse" value={formData.address} onChange={e => handleChange("address", e.target.value)} required/>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Ville" value={formData.city} onChange={e => handleChange("city", e.target.value)} required/>
                <Select value={formData.country} onValueChange={v => handleChange("country", v)}>
                  <SelectTrigger><SelectValue placeholder="Pays"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Congo">Congo</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Téléphone" value={formData.phone} onChange={e => handleChange("phone", e.target.value)}/>
              <Input placeholder="Email" value={formData.email} onChange={e => handleChange("email", e.target.value)} required/>
              <Input placeholder="Site web" value={formData.website} onChange={e => handleChange("website", e.target.value)}/>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/login")}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'établissement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
