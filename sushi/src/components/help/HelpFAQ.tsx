import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  AlertTriangle,
  Settings,
  FileText,
  CreditCard,
  Calendar,
  Users
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'Général',
    question: 'Comment fonctionne la plateforme Acadex App ?',
    answer: 'Acadex App est une plateforme de gestion scolaire complète qui permet aux administrateurs, enseignants, élèves et parents de gérer toutes les activités scolaires. Vous pouvez accéder à différentes fonctionnalités selon votre rôle : tableau de bord, notes, devoirs, messagerie, etc.',
    icon: HelpCircle,
    priority: 'high'
  },
  {
    id: '2',
    category: 'Connexion',
    question: 'J\'ai oublié mon mot de passe, comment faire ?',
    answer: 'Cliquez sur le lien "Mot de passe oublié" sur la page de connexion. Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe. Si vous ne recevez pas l\'email, vérifiez votre dossier spam ou contactez votre administrateur.',
    icon: Settings,
    priority: 'high'
  },
  {
    id: '3',
    category: 'Notes',
    question: 'Comment consulter mes notes ou celles de mes enfants ?',
    answer: 'Connectez-vous à votre compte et naviguez vers l\'onglet "Notes" ou "Bulletins". Les élèves peuvent voir leurs propres notes, les parents peuvent voir les notes de leurs enfants, et les enseignants peuvent saisir et consulter les notes de leurs classes.',
    icon: FileText,
    priority: 'medium'
  },
  {
    id: '4',
    category: 'Devoirs',
    question: 'Comment soumettre un devoir en ligne ?',
    answer: 'Allez dans l\'onglet "Devoirs" ou "Mes Devoirs", sélectionnez le devoir concerné et cliquez sur "Soumettre". Vous pouvez téléverser des fichiers ou écrire votre réponse directement dans la zone de texte prévue à cet effet.',
    icon: BookOpen,
    priority: 'medium'
  },
  {
    id: '5',
    category: 'Messagerie',
    question: 'Comment contacter mes professeurs ou les parents ?',
    answer: 'Utilisez la messagerie intégrée pour communiquer avec les autres utilisateurs. Vous pouvez envoyer des messages individuels ou de groupe, joindre des fichiers et suivre vos conversations.',
    icon: MessageCircle,
    priority: 'medium'
  },
  {
    id: '6',
    category: 'Présence',
    question: 'Comment consulter mes absences ou justifier une absence ?',
    answer: 'Dans l\'onglet "Présences", vous pouvez voir votre historique de présence. Pour justifier une absence, cliquez sur "Justificatifs" et téléversez un document justificatif (certificat médical, etc.).',
    icon: Calendar,
    priority: 'medium'
  },
  {
    id: '7',
    category: 'Paiements',
    question: 'Comment payer les frais scolaires en ligne ?',
    answer: 'Allez dans l\'onglet "Finance" ou "Frais Scolaires" pour voir les montants dus. Vous pouvez payer en ligne via différentes méthodes de paiement sécurisées. Les reçus sont automatiquement générés.',
    icon: CreditCard,
    priority: 'high'
  },
  {
    id: '8',
    category: 'Technique',
    question: 'La plateforme est lente ou ne fonctionne pas correctement',
    answer: 'Essayez de vider le cache de votre navigateur, de vérifier votre connexion internet, ou d\'utiliser un autre navigateur (Chrome, Firefox). Si le problème persiste, contactez le support technique via le formulaire d\'aide.',
    icon: AlertTriangle,
    priority: 'high'
  },
  {
    id: '9',
    category: 'Compte',
    question: 'Comment modifier mes informations personnelles ?',
    answer: 'Allez dans "Paramètres" puis "Profil" pour mettre à jour vos informations personnelles, votre photo de profil et vos préférences. Certaines modifications peuvent nécessiter l\'approbation d\'un administrateur.',
    icon: Users,
    priority: 'low'
  },
  {
    id: '10',
    category: 'Mobile',
    question: 'Puis-je utiliser Acadex App sur mon téléphone ?',
    answer: 'Oui, Acadex App est responsive et fonctionne parfaitement sur les mobiles. Vous pouvez y accéder via votre navigateur mobile. Une application mobile dédiée sera bientôt disponible.',
    icon: HelpCircle,
    priority: 'low'
  }
];

const categoryColors: Record<string, string> = {
  'Général': 'bg-blue-100 text-blue-800',
  'Connexion': 'bg-purple-100 text-purple-800',
  'Notes': 'bg-green-100 text-green-800',
  'Devoirs': 'bg-orange-100 text-orange-800',
  'Messagerie': 'bg-cyan-100 text-cyan-800',
  'Présence': 'bg-yellow-100 text-yellow-800',
  'Paiements': 'bg-red-100 text-red-800',
  'Technique': 'bg-gray-100 text-gray-800',
  'Compte': 'bg-indigo-100 text-indigo-800',
  'Mobile': 'bg-pink-100 text-pink-800'
};

const priorityColors: Record<string, string> = {
  'high': 'bg-red-500',
  'medium': 'bg-yellow-500', 
  'low': 'bg-green-500'
};

export const HelpFAQ: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', ...Array.from(new Set(faqData.map(item => item.category)))];
  
  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredFAQ.map(item => item.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">FAQ - Questions Fréquemment Posées</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Trouvez des réponses rapides aux questions les plus courantes. Cliquez sur une question pour voir la réponse détaillée.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <HelpCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category === 'all' ? 'Toutes les catégories' : category}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Replier tout
            </Button>
            <Button variant="outline" size="sm" onClick={expandAll}>
              Déplier tout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredFAQ.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune question trouvée pour votre recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQ.map((item) => (
            <Card key={item.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full p-4 h-auto justify-start text-left"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${priorityColors[item.priority]}`} />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{item.question}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </Button>
                
                {expandedItems.has(item.id) && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-10 pl-7 border-l-2 border-muted">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${categoryColors[item.category]}`}
                        >
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Priorité: {item.priority === 'high' ? 'Élevée' : item.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Vous ne trouvez pas votre réponse ?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Notre équipe de support est là pour vous aider. Envoyez-nous votre question via le formulaire d'aide.
          </p>
          <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Contacter le support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
