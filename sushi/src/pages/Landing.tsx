import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { acadexTheme } from "@/theme/acadexTheme";
import "@/theme/acadexStyles.css";
import {
  Shield,
  GraduationCap,
  Users,
  BarChart,
  MessageSquare,
  Database,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Clock,
  Target,
  TrendingUp,
  RefreshCw,
  Moon,
  Sun,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Zap,
  Globe,
  Smartphone,
  Star,
  Calendar,
  FileText,
  Settings,
  Lock,
  Cloud,
  Bell,
  Users2,
  BookOpen,
  Award,
  Headphones,
  Monitor,
  Tablet
} from "lucide-react";

export default function Landing() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeRole, setActiveRole] = useState("admin");
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    newsletter: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Appliquer le mode sombre/clair au document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Ajouter les styles CSS pour l'animation
  useEffect(() => {
    // Injecter les styles CSS pour l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.8s ease-out;
      }
    `;
    document.head.appendChild(style);

    // Gérer le scroll pour la navigation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fonction pour soumettre le formulaire de contact
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('Message envoyé avec succès !');
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          newsletter: false
        });
      } else {
        setSubmitStatus('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    } catch (error) {
      setSubmitStatus('Erreur de connexion. Veuillez réessayer plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour gérer les changements du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const roles = [
    { 
      id: "admin", 
      name: "Administrateurs et directeurs", 
      icon: Shield,
      // Couleurs ACADEX - Admin: Bleu principal #388bcf
      color: acadexTheme.colors.gradients.admin,
      bgColor: acadexTheme.colors.backgrounds.primary,
      darkBgColor: acadexTheme.colors.backgrounds.primaryDark,
      lightText: acadexTheme.colors.text.primary,
      stats: ["Gestion complète", "Tableaux de bord", "Sécurité", "Automatisation"],
      features: ["Gestion des élèves", "Planning scolaire", "Rapports automatiques", "Communication"],
      description: "Gérez votre établissement avec efficacité grâce à des outils puissants et une interface intuitive.",
      cta: "Optimisez votre administration"
    },
    { 
      id: "teacher", 
      name: "Enseignants", 
      icon: GraduationCap,
      // Couleurs ACADEX - Teacher: Vert émeraude
      color: acadexTheme.colors.gradients.teacher,
      bgColor: "from-emerald-50 to-teal-50",
      darkBgColor: "from-emerald-900/20 to-teal-800/20",
      lightText: "text-emerald-900",
      stats: ["Suivi pédagogique", "Évaluation", "Communication", "Ressources"],
      features: ["Cahier de notes", "Devoirs", "Messagerie", "Ressources"],
      description: "Enseignez plus efficacement avec des outils pédagogiques modernes et un suivi personnalisé.",
      cta: "Enseignez avec innovation"
    },
    { 
      id: "parent", 
      name: "Parents d'élèves", 
      icon: Users,
      // Couleurs ACADEX - Parent: Violet indigo
      color: acadexTheme.colors.gradients.parent,
      bgColor: "from-purple-50 to-indigo-50",
      darkBgColor: "from-purple-900/20 to-indigo-800/20",
      lightText: "text-purple-900",
      stats: ["Suivi en temps réel", "Communication", "Résultats", "Événements"],
      features: ["Bulletins", "Communication", "Calendrier", "Alertes"],
      description: "Suivez le parcours scolaire de vos enfants en temps réel. Accédez aux contenus pédagogiques et aux résultats scolaires de vos enfants.",
      cta: "Accompagnez la réussite"
    },
    { 
      id: "student", 
      name: "Élèves", 
      icon: Users,
      // Couleurs ACADEX - Student: Orange rouge
      color: acadexTheme.colors.gradients.student,
      bgColor: "from-orange-50 to-red-50",
      darkBgColor: "from-orange-900/20 to-red-800/20",
      lightText: "text-orange-900",
      stats: ["Cours", "Devoirs", "Résultats", "Communication"],
      features: ["Emploi du temps", "Devoirs", "Résultats", "Messagerie"],
      description: "Apprenez et progressez avec une plateforme adaptée à vos besoins et votre rythme.",
      cta: "Réussissez vos études"
    }
  ];

  const features = [
    { 
      icon: BookOpen, 
      title: "Library Management", 
      description: "Maintain a digital catalog, track borrowing, returns, and overdue books easily.",
      // Couleur ACADEX - Bibliothèque: Vert forêt
      color: acadexTheme.colors.gradients.library,
      bgColor: "from-green-50 to-emerald-50",
      darkBgColor: "from-green-900/20 to-emerald-800/20"
    },
    { 
      icon: FileText, 
      title: "Prise de Notes pendant le cours", 
      description: "Prenez et organisez vos notes facilement pendant les cours en temps réel.",
      // Couleur ACADEX - Notes: Bleu principal
      color: acadexTheme.colors.gradients.notes,
      bgColor: "from-blue-50 to-indigo-50",
      darkBgColor: "from-blue-900/20 to-indigo-800/20"
    },
    { 
      icon: Monitor, 
      title: "Cours en ligne", 
      description: "Accédez aux cours et ressources pédagogiques depuis n'importe où.",
      // Couleur ACADEX - Cours en ligne: Violet
      color: acadexTheme.colors.gradients.courses,
      bgColor: "from-purple-50 to-indigo-50",
      darkBgColor: "from-purple-900/20 to-indigo-800/20"
    },
    { 
      icon: WifiOff, 
      title: "Mode hors ligne", 
      description: "Continuez à travailler sans connexion internet.",
      // Couleur ACADEX - Hors ligne: Gris bleuté
      color: acadexTheme.colors.gradients.offline,
      bgColor: "from-slate-50 to-gray-50",
      darkBgColor: "from-slate-900/20 to-gray-800/20"
    }
  ];

  const mobileFeatures = [
    {
      icon: Smartphone,
      title: "Notifications Instantanées",
      description: "Recevez des alertes en temps réel pour les devoirs, examens et communications importantes."
    },
    {
      icon: Calendar,
      title: "Calendrier Intégré",
      description: "Consultez votre emploi du temps, les événements scolaires et les dates importantes."
    },
    {
      icon: MessageSquare,
      title: "Messagerie Directe",
      description: "Communiquez facilement avec les enseignants et les autres parents via l'application."
    },
    {
      icon: FileText,
      title: "Notes et Bulletins",
      description: "Accédez rapidement aux résultats scolaires et téléchargez les bulletins officiels."
    },
    {
      icon: Bell,
      title: "Rappels Automatiques",
      description: "Ne manquez jamais une échéance grâce aux rappels intelligents pour les devoirs et événements."
    },
    {
      icon: Users2,
      title: "Communauté Scolaire",
      description: "Connectez-vous avec la communauté éducative et participez aux discussions de classe."
    }
  ];

  const futureFeatures = [
    {
      icon: Headphones,
      title: "Assistant IA Pédagogique",
      description: "Soutien personnalisé avec intelligence artificielle pour aider les élèves dans leurs apprentissages.",
      status: "En développement",
      progress: 75
    },
    {
      icon: Globe,
      title: "Salles de Classe Virtuelles",
      description: "Classes en ligne interactives avec tableau blanc partagé et vidéoconférence intégrée.",
      status: "Bientôt disponible",
      progress: 60
    },
    {
      icon: Award,
      title: "Gamification de l'Apprentissage",
      description: "Système de récompenses et badges pour motiver les élèves et suivre leurs progrès.",
      status: "En test",
      progress: 45
    },
    
    {
      icon: Smartphone,
      title: "App Mobile Avancée",
      description: "Version mobile enrichie avec réalité augmentée, reconnaissance vocale et synchronisation temps réel multi-appareils.",
      status: "En développement",
      progress: 85
    },
    {
      icon: BookOpen,
      title: "Library Management Avancé",
      description: "Catalogue numérique intelligent avec IA de recommandation, gestion automatique des prêts et intégration avec les bibliothèques partenaires.",
      status: "En développement",
      progress: 70
    },
    {
      icon: FileText,
      title: "Notes Collaboratives IA",
      description: "Prise de notes collaborative avec transcription automatique, résumés IA et partage en temps réel pendant les cours.",
      status: "En test",
      progress: 55
    },
    {
      icon: Monitor,
      title: "Cours en Ligne Immersifs",
      description: "Plateforme LMS avancée avec laboratoires virtuels, simulations 3D et suivi personnalisé des apprentissages.",
      status: "Bientôt disponible",
      progress: 65
    },
    {
      icon: WifiOff,
      title: "Mode Hors Ligne Étendu",
      description: "Synchronisation intelligente avec cache prédictif et édition collaborative complète sans connexion internet.",
      status: "En planification",
      progress: 40
    }
  ];

  const stats = [
    { number: "10K+", label: "Écoles utilisatrices" },
    { number: "500K+", label: "Élèves inscrits" },
    { number: "50K+", label: "Enseignants actifs" },
    { number: "99.9%", label: "Temps de disponibilité" }
  ];

  const testimonials = [
    { 
      name: "Thomas Mukendi", 
      role: "Administrateur - Groupe Scolaire",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "La plateforme nous a fait gagner un temps précieux dans l'administration de nos 5 écoles.", 
      rating: 4 
    },
    { 
      name: "Grace Mbombo", 
      role: "Secrétaire - École Secondaire",
      photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
      content: "La gestion des frais et des paiements n'a jamais été aussi simple. Tout est automatisé !", 
      rating: 5 
    },
    { 
      name: "David Kanza", 
      role: "Censeur - Complexe Scolaire",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      content: "Je peux superviser toutes les activités de notre établissement en temps réel. C'est un outil indispensable.", 
      rating: 5 
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 ${
          isScrolled 
            ? isDarkMode ? 'bg-gray-900/90 shadow-lg' : 'bg-white/90 shadow-lg'
            : isDarkMode ? 'bg-gray-900/70' : 'bg-white/70'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 acadex-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ACADEX
                </span>
              </Link>
            </div>
            
            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a href="#features" className={`transition-colors font-medium text-sm lg:text-base ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'}`}>Fonctionnalités</a>
              <a href="#key-features" className={`transition-colors font-medium text-sm lg:text-base ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'}`}>Services</a>
              <a href="#testimonials" className={`transition-colors font-medium text-sm lg:text-base ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'}`}>Témoignages</a>
              <a href="#contact" className={`transition-colors font-medium text-sm lg:text-base ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'}`}>Contact</a>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Bouton toggle mode sombre/clair */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="h-3 w-3 sm:h-4 sm:w-4" /> : <Moon className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
              
              <div className="hidden sm:flex">
                <Link to="/login">
                  <Button variant="outline" className={`border-blue-600 text-blue-600 hover:bg-blue-50 font-medium px-2 sm:px-4 text-xs sm:text-sm ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'}`}>
                    Se connecter
                  </Button>
                </Link>
              </div>
              <Link to="/login">
                <Button className="acadex-primary hover:opacity-90 font-medium px-2 sm:px-4 text-xs sm:text-sm shadow-lg">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

        {/* Hero Section */}
      <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Background Pattern */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900' : 'bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30'}`}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            {/* Logo Hero */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 acadex-primary rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            </div>
            
            <Badge className={`mb-6 px-4 py-2 text-sm font-medium acadex-primary text-white`}>
              🎓 La Révolution de l'Éducation Numérique
            </Badge>
            
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-tight`}>
              ACADEX
              <span className={`block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 sm:mt-4 ${acadexTheme.colors.text.primary}`}>
                Plateforme Scolaire Intelligente
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto mb-8 sm:mb-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
              Transformez votre établissement avec une solution complète qui connecte élèves, enseignants, 
              parents et administrateurs dans un écosystème éducatif moderne.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Button size="lg" className="acadex-primary text-white font-bold px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                Commencer Gratuitement <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className={`border-2 ${acadexTheme.colors.borders.primary} ${acadexTheme.colors.text.primary} font-bold px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl hover:bg-blue-50 transition-all duration-300`}>
                Voir la Démo
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 acadex-primary rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 acadex-primary rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 acadex-primary-light rounded-full opacity-15 animate-pulse"></div>
      </section>

      {/* Stats Section */}
      <section className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${acadexTheme.colors.text.primary} mb-2`}>
                  {stat.number}
                </div>
                <div className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="key-features" className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Fonctionnalités Clés d'ACADEX APP
            </h2>
            <p className={`text-base sm:text-lg lg:text-xl max-w-2xl sm:max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Découvrez toutes les fonctionnalités qui font d'ACADEX APP la solution complète pour la gestion scolaire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Gestion Administrative */}
            <Card className={`p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gestion Administrative</h3>
                <ul className={`space-y-1 sm:space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Gestion des élèves et classes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Administration du personnel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Gestion des matières et programmes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Rapports et statistiques</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pédagogie et Enseignement */}
            <Card className={`p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pédagogie et Enseignement</h3>
                <ul className={`space-y-1 sm:space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Création de contenus pédagogiques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Gestion des devoirs et évaluations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Suivi des apprentissages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Bibliothèque de ressources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Communication */}
            <Card className={`p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Communication</h3>
                <ul className={`space-y-1 sm:space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Messagerie instantanée</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Notifications automatiques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Communication parents-enseignants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Annonces et informations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Suivi et Évaluation */}
            <Card className={`p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Suivi et Évaluation</h3>
                <ul className={`space-y-1 sm:space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Gestion des notes et bulletins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Suivi des présences</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Évaluations et rapports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Statistiques de progression</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Planning et Calendrier */}
            <Card className={`p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Planning et Calendrier</h3>
                <ul className={`space-y-1 sm:space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Emploi du temps intelligent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Gestion des événements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Rappels automatiques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Calendrier partagé</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className={`py-20 px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ACADEX s'adapte à chaque acteur de l'éducation
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Une solution complète conçue pour les administrateurs, enseignants, parents et élèves
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex justify-center mb-8 sm:mb-10 lg:mb-12">
            <div className={`inline-flex rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} p-1 max-w-full overflow-x-auto`}>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                {roles.map((role) => (
                  <Button
                    key={role.id}
                    variant={activeRole === role.id ? "default" : "ghost"}
                    onClick={() => setActiveRole(role.id)}
                    className={`rounded-md whitespace-nowrap transition-all duration-200 ${
                      activeRole === role.id 
                        ? 'bg-gradient-to-r ' + role.color + ' text-white shadow-lg transform scale-105' 
                        : isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                    } text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5`}
                  >
                    <role.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{role.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Content */}
          <div className={`bg-gradient-to-br ${isDarkMode ? roles.find(r => r.id === activeRole)?.darkBgColor : roles.find(r => r.id === activeRole)?.bgColor} rounded-2xl p-8 md:p-12`}>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className={`w-16 h-16 mb-6 rounded-full bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.color} flex items-center justify-center text-white`}>
                    {(() => {
                      const Icon = roles.find(r => r.id === activeRole)?.icon;
                      return Icon ? <Icon className="h-8 w-8" /> : null;
                    })()}
                  </div>
                  <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {roles.find(r => r.id === activeRole)?.name}
                  </h3>
                  <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {roles.find(r => r.id === activeRole)?.description}
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    {roles.find(r => r.id === activeRole)?.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button size="lg" className={`bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.color} hover:opacity-90`}>
                    {roles.find(r => r.id === activeRole)?.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <div className={`rounded-2xl p-8 shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[Monitor, Tablet, Smartphone].map((Icon, index) => (
                        <div key={index} className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                            <Icon className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {index === 0 ? 'Desktop' : index === 1 ? 'Tablette' : 'Mobile'}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full w-3/4 bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.color} rounded-full`} />
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full w-1/2 bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.color} rounded-full`} />
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full w-2/3 bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.color} rounded-full`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    
        

      {/* Testimonials */}
      <section id="testimonials" className={`py-20 px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Témoignages</h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ce que nos utilisateurs disent de Acadex App</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={`p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardContent className="space-y-4">
                  {/* Photo et infos */}
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.photo} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                    />
                    <div className="flex-1">
                      <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Témoignage */}
                  <div className={`relative ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`absolute -top-2 -left-2 text-6xl ${isDarkMode ? 'text-gray-700' : 'text-gray-200'} opacity-50`}>"</div>
                    <p className="italic leading-relaxed pl-6 relative z-10">{testimonial.content}</p>
                  </div>
                  
                  {/* Métadonnées */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Il y a {Math.floor(Math.random() * 30) + 1} jours
                    </span>
                    <Button variant="outline" size="sm" className="text-xs">
                      Lire plus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Contactez-nous
            </h2>
            <p className={`text-base sm:text-lg lg:text-xl max-w-2xl sm:max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Une question ? Une suggestion ? Notre équipe est là pour vous aider à transformer votre établissement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Information */}
            <div className={`space-y-6 sm:space-y-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Informations de Contact
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Siège Social</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        5093 Avenue Allée Masikita, 012 Kinshasa
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        contact@acadex.com
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        +243 858 726 825
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Horaires d'Ouverture
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Lundi - Vendredi</span>
                      <span className="font-medium">9h00 - 18h00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Samedi</span>
                      <span className="font-medium">9h00 - 12h00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimanche</span>
                      <span className="font-medium">Fermé</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Réseaux Sociaux */}
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Suivez-nous
                </h3>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}>
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}>
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}>
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={`p-6 sm:p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg sm:text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Envoyez-nous un Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom Complet
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sujet
                  </label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Choisissez un sujet</option>
                    <option value="demo">Demande de démo</option>
                    <option value="info">Information</option>
                    <option value="support">Support technique</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Décrivez votre demande..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newsletter"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className={`w-4 h-4 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <label htmlFor="newsletter" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Je souhaite recevoir la newsletter ACADEX APP
                  </label>
                </div>

                {submitStatus && (
                  <div className={`p-3 rounded-lg text-sm ${submitStatus.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {submitStatus}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le Message'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-4 acadex-primary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Découvrez par vous-même comment ACADEX peut résoudre vos besoins
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8">
            Demandez dès maintenant une démo personnalisée pour une expérience captivante et concrète
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 font-medium">
            Demander une démonstration <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Logo et Description */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 acadex-primary rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <GraduationCap className="h-10 w-10" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">ACADEX APP</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              La solution complète pour la gestion scolaire moderne. Transformez votre établissement avec une plateforme 
              intelligente qui connecte tous les acteurs de l'éducation.
            </p>
          </div>

          {/* Grille de liens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Produit */}
            <div>
              <h4 className="font-semibold mb-6 text-white flex items-center gap-2">
                <div className="w-2 h-2 acadex-primary rounded-full"></div>
                Produit
              </h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500">Fonctionnalités</span></li>
                <li><span className="text-gray-500">Tarifs</span></li>
                <li><span className="text-gray-500">Démo</span></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-6 text-white flex items-center gap-2">
                <div className="w-2 h-2 acadex-primary rounded-full"></div>
                Support
              </h4>
              <ul className="space-y-3">
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-semibold mb-6 text-white flex items-center gap-2">
                <div className="w-2 h-2 acadex-primary rounded-full"></div>
                Ressources
              </h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500">Guide de démarrage</span></li>
                <li><span className="text-gray-500">Tutoriels vidéo</span></li>
                <li><span className="text-gray-500">Blog</span></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="font-semibold mb-6 text-white flex items-center gap-2">
                <div className="w-2 h-2 acadex-primary rounded-full"></div>
                Légal
              </h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500">Conditions d'utilisation</span></li>
                <li><span className="text-gray-500">Politique de confidentialité</span></li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="text-xl font-bold text-white mb-4">Restez informé</h4>
              <p className="text-gray-400 mb-6">
                Recevez les dernières actualités et fonctionnalités d'ACADEX
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button className="acadex-primary text-white px-6 py-3 font-medium">
                  S'abonner
                </Button>
              </div>
            </div>
          </div>

          {/* Barre de séparation */}
          <div className={`border-t mb-8 ${isDarkMode ? 'border-gray-800' : 'border-gray-800'}`}></div>

          {/* Copyright */}
          <div className="text-center">
            <div className="text-gray-400">
              <p>© 2024 ACADEX APP. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
