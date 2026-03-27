import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Users, Shield, Settings, Smartphone, GraduationCap, FileText, Video, Download, Search, ChevronRight, ExternalLink } from "lucide-react";
import { acadexTheme } from "@/theme/acadexTheme";

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");

  const documentationData = [
    {
      id: "getting-started",
      title: "Premiers Pas",
      icon: GraduationCap,
      color: acadexTheme.colors.gradients.primary,
      description: "Guide d'installation et configuration initiale",
      sections: [
        {
          title: "Créer votre compte",
          content: "Suivez notre guide étape par étape pour créer votre compte ACADEX et configurer votre profil.",
          type: "guide",
          difficulty: "Débutant"
        },
        {
          title: "Configuration de l'établissement",
          content: "Apprenez à configurer votre école, ajouter des classes et définir les paramètres de base.",
          type: "tutorial",
          difficulty: "Intermédiaire"
        },
        {
          title: "Inviter les utilisateurs",
          content: "Découvrez comment inviter enseignants, parents et élèves à rejoindre votre plateforme.",
          type: "guide",
          difficulty: "Débutant"
        }
      ]
    },
    {
      id: "features",
      title: "Fonctionnalités",
      icon: Settings,
      color: acadexTheme.colors.gradients.teacher,
      description: "Guide détaillé de toutes les fonctionnalités",
      sections: [
        {
          title: "Gestion des élèves",
          content: "Gestion complète des dossiers étudiants, inscriptions et suivi académique.",
          type: "tutorial",
          difficulty: "Intermédiaire"
        },
        {
          title: "Planning et calendrier",
          content: "Création et gestion des emplois du temps, événements et rappels automatiques.",
          type: "guide",
          difficulty: "Débutant"
        },
        {
          title: "Cahier de notes en ligne",
          content: "Saisie des notes, calcul automatique des moyennes et génération de bulletins.",
          type: "tutorial",
          difficulty: "Intermédiaire"
        },
        {
          title: "Messagerie interne",
          content: "Communication sécurisée entre enseignants, parents et élèves.",
          type: "guide",
          difficulty: "Débutant"
        }
      ]
    },
    {
      id: "mobile",
      title: "Application Mobile",
      icon: Smartphone,
      color: acadexTheme.colors.gradients.mobile,
      description: "Guide de l'application mobile ACADEX",
      sections: [
        {
          title: "Installation et configuration",
          content: "Téléchargez et configurez l'application mobile sur iOS et Android.",
          type: "guide",
          difficulty: "Débutant"
        },
        {
          title: "Fonctionnalités mobiles",
          content: "Découvrez les fonctionnalités exclusives de l'application mobile.",
          type: "tutorial",
          difficulty: "Débutant"
        },
        {
          title: "Notifications push",
          content: "Configurez et gérez les notifications pour ne rien manquer.",
          type: "guide",
          difficulty: "Débutant"
        }
      ]
    },
    {
      id: "admin",
      title: "Administration",
      icon: Shield,
      color: acadexTheme.colors.gradients.admin,
      description: "Guide pour administrateurs système",
      sections: [
        {
          title: "Gestion des utilisateurs",
          content: "Création, modification et suppression des comptes utilisateurs.",
          type: "tutorial",
          difficulty: "Avancé"
        },
        {
          title: "Sécurité et permissions",
          content: "Configuration des droits d'accès et politiques de sécurité.",
          type: "guide",
          difficulty: "Avancé"
        },
        {
          title: "Sauvegarde et récupération",
          content: "Procédures de sauvegarde des données et récupération en cas d'incident.",
          type: "tutorial",
          difficulty: "Avancé"
        }
      ]
    }
  ];

  const tutorials = [
    {
      title: "Démarrage rapide - 5 minutes",
      description: "Les essentiels pour commencer avec ACADEX",
      duration: "5 min",
      type: "video",
      icon: Video
    },
    {
      title: "Créer votre première classe",
      description: "Guide pratique pour les enseignants",
      duration: "10 min",
      type: "video",
      icon: Video
    },
    {
      title: "Configuration parent-élève",
      description: "Connecter les familles à la plateforme",
      duration: "8 min",
      type: "video",
      icon: Video
    }
  ];

  const resources = [
    {
      title: "Guide PDF complet",
      description: "Téléchargez notre guide PDF pour une consultation hors ligne",
      type: "pdf",
      icon: Download
    },
    {
      title: "API Documentation",
      description: "Documentation technique pour les développeurs",
      type: "api",
      icon: ExternalLink
    },
    {
      title: "Centre d'aide",
      description: "Articles détaillés et résolution de problèmes",
      type: "help",
      icon: BookOpen
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case "Débutant": return "bg-green-100 text-green-800";
      case "Intermédiaire": return "bg-yellow-100 text-yellow-800";
      case "Avancé": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "video": return Video;
      case "pdf": return FileText;
      case "api": return ExternalLink;
      default: return BookOpen;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 acadex-primary rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <BookOpen className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation ACADEX
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Guides, tutoriels et ressources pour maîtriser ACADEX
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher dans la documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="font-bold text-lg mb-4">Navigation</h3>
              <nav className="space-y-2">
                {documentationData.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4" />
                      {section.title}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Active Section */}
            {documentationData
              .filter(section => section.id === activeSection)
              .map((section) => (
                <div key={section.id} className="space-y-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white`}>
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                        <p className="text-gray-600">{section.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {section.sections.map((doc, index) => (
                      <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">{doc.title}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(doc.difficulty)}`}>
                                  {doc.difficulty}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-4">{doc.content}</p>
                              <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" className="border-blue-600 text-blue-600">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Lire la suite
                                </Button>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  {React.createElement(getTypeIcon(doc.type), { className: "h-3 w-3" })}
                                  {doc.type}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-500 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            }

            {/* Video Tutorials */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Tutoriels Vidéo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map((tutorial, index) => (
                  <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Video className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{tutorial.title}</h4>
                          <p className="text-sm text-gray-500">{tutorial.duration}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{tutorial.description}</p>
                      <Button className="w-full acadex-primary text-white">
                        <Video className="h-4 w-4 mr-2" />
                        Regarder
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Ressources Additionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.map((resource, index) => (
                  <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <resource.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                      </div>
                      <p className="text-gray-600 mb-4">{resource.description}</p>
                      <Button variant="outline" className="w-full border-blue-600 text-blue-600">
                        {resource.type === "pdf" && <Download className="h-4 w-4 mr-2" />}
                        {resource.type === "api" && <ExternalLink className="h-4 w-4 mr-2" />}
                        {resource.type === "help" && <BookOpen className="h-4 w-4 mr-2" />}
                        Accéder
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-12 bg-white rounded-lg shadow-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Besoin d'aide supplémentaire ?
              </h3>
              <p className="text-gray-600 mb-6">
                Notre équipe de support est disponible pour vous accompagner
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button className="acadex-primary text-white">
                    Contacter le support
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button variant="outline" className="border-blue-600 text-blue-600">
                    Consulter la FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
