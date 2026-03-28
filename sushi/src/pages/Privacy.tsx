import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { acadexTheme } from "@/theme/acadexTheme";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 acadex-primary rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <Shield className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-gray-600">
              Dernière mise à jour : 17 Mars 2024
            </p>
          </div>

          {/* Privacy Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Notre Engagement</h2>
              <p className="text-gray-600 leading-relaxed">
                Chez ACADEX, nous prenons la protection de vos données personnelles très au sérieux. 
                Cette politique explique comment nous collectons, utilisons et protégeons vos informations 
                conformément au RGPD et aux régulations applicables.
              </p>
            </section>

            {/* Données Collectées */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Collectées</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Informations de compte</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Nom, prénom, adresse email</li>
                    <li>Rôle (administrateur, enseignant, parent, élève)</li>
                    <li>Établissement scolaire</li>
                    <li>Numéro de téléphone (optionnel)</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Données académiques</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Notes et évaluations</li>
                    <li>Présence et assiduité</li>
                    <li>Emploi du temps et calendrier</li>
                    <li>Devoirs et travaux rendus</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Données techniques</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Adresse IP et type d'appareil</li>
                    <li>Données de navigation et utilisation</li>
                    <li>Cookies et technologies similaires</li>
                    <li>Logs de connexion et d'activité</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Utilisation des Données */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation de Vos Données</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Fournir le service</h3>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Gestion des comptes utilisateurs</li>
                    <li>• Communication scolaire</li>
                    <li>• Suivi pédagogique</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Améliorer le service</h3>
                  </div>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Analyse d'utilisation</li>
                    <li>• Développement de fonctionnalités</li>
                    <li>• Support technique</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Sécurité</h3>
                  </div>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Protection des comptes</li>
                    <li>• Prévention des fraudes</li>
                    <li>• Conformité légale</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">Communication</h3>
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Newsletter (avec consentement)</li>
                    <li>• Notifications importantes</li>
                    <li>• Support client</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Base Légale */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Légale du Traitement</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Consentement</p>
                    <p className="text-gray-600 text-sm">Pour la newsletter et communications marketing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Obligation contractuelle</p>
                    <p className="text-gray-600 text-sm">Pour fournir les services essentiels d'ACADEX</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Intérêt légitime</p>
                    <p className="text-gray-600 text-sm">Pour la sécurité et l'amélioration du service</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Partage des Données */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage de Vos Données</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-900 font-semibold mb-2">Nous ne vendons pas vos données</p>
                    <p className="text-red-800 text-sm mb-3">
                      Vos données ne sont partagées que dans les cas suivants :
                    </p>
                    <ul className="list-disc list-inside text-red-800 space-y-1 text-sm">
                      <li>Avec votre consentement explicite</li>
                      <li>Avec les autorités scolaires concernées</li>
                      <li>Pour obligations légales (justice, sécurité)</li>
                      <li>Avec nos sous-traitants techniques (hébergement, support)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Sécurité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Mesures de Sécurité</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Chiffrement</p>
                      <p className="text-gray-600 text-sm">Données chiffrées SSL/TLS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Sauvegardes</p>
                      <p className="text-gray-600 text-sm">Sauvegardes quotidiennes sécurisées</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Accès contrôlé</p>
                      <p className="text-gray-600 text-sm">Autorisations basées sur les rôles</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Audits réguliers</p>
                      <p className="text-gray-600 text-sm">Vérifications de sécurité périodiques</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Droits RGPD */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos Droits (RGPD)</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Droit d'accès</h3>
                  <p className="text-gray-600 text-sm">
                    Vous pouvez demander une copie de toutes vos données personnelles.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Droit de rectification</h3>
                  <p className="text-gray-600 text-sm">
                    Vous pouvez corriger les informations inexactes ou incomplètes.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Droit à l'oubli</h3>
                  <p className="text-gray-600 text-sm">
                    Vous pouvez demander la suppression de vos données personnelles.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Portabilité des données</h3>
                  <p className="text-gray-600 text-sm">
                    Vous pouvez transférer vos données vers un autre service.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies et Technologies Similaires</h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  Nous utilisons des cookies pour améliorer votre expérience :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900">Cookies essentiels</h4>
                    <p className="text-gray-600 text-sm">Nécessaires au fonctionnement du site</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900">Cookies de performance</h4>
                    <p className="text-gray-600 text-sm">Pour analyser l'utilisation du service</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Conservation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Durée de Conservation</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  Vos données sont conservées selon les durées suivantes :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Compte actif :</strong> Pendant toute la durée d'utilisation</li>
                  <li><strong>Après résiliation :</strong> 3 ans pour raisons légales</li>
                  <li><strong>Données académiques :</strong> Conformément aux obligations légales</li>
                  <li><strong>Logs techniques :</strong> 12 mois maximum</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact et Délégué à la Protection des Données</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-900 font-semibold mb-2">Pour exercer vos droits ou poser des questions :</p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>Email DPD :</strong> dpo@acadx.app</p>
                  <p><strong>Email support :</strong> privacy@acadx.app</p>
                  <p><strong>Téléphone :</strong> +33 1 234 567 890</p>
                  <p><strong>Délai de réponse :</strong> 30 jours maximum</p>
                </div>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications de cette Politique</h2>
              <p className="text-gray-600 leading-relaxed">
                Cette politique peut être modifiée pour refléter les changements dans nos pratiques 
                ou les exigences légales. Les modifications seront notifiées par email et publiées 
                sur cette page avec la date de mise à jour.
              </p>
            </section>

            {/* Acceptation */}
            <section className="border-t pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  En utilisant ACADEX, vous acceptez notre politique de confidentialité 
                  et consentez au traitement de vos données comme décrit ci-dessus.
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/auth/register">
                    <Button className="acadex-primary text-white">
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="border-blue-600 text-blue-600">
                      Contacter le DPD
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
