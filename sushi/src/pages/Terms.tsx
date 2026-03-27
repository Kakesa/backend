import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Users, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { acadexTheme } from "@/theme/acadexTheme";

export default function Terms() {
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
                <FileText className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Conditions d'Utilisation
            </h1>
            <p className="text-xl text-gray-600">
              Dernière mise à jour : 17 Mars 2024
            </p>
          </div>

          {/* Terms Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Bienvenue sur ACADEX. Ces conditions d'utilisation régissent votre accès et utilisation de notre plateforme éducative. 
                En utilisant ACADEX, vous acceptez ces termes dans leur intégralité.
              </p>
            </section>

            {/* Acceptation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptation des Conditions</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">En créant un compte ACADEX, vous acceptez ces conditions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">L'utilisation continue de la plateforme confirme votre acceptation</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">Si vous n'acceptez pas ces termes, n'utilisez pas ACADEX</p>
                </div>
              </div>
            </section>

            {/* Description du Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Description du Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                ACADEX est une plateforme éducative qui offre :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>Gestion scolaire et administrative</li>
                <li>Communication entre enseignants, parents et élèves</li>
                <li>Suivi pédagogique et évaluation</li>
                <li>Planning et calendrier scolaire</li>
                <li>Bibliothèque numérique et ressources pédagogiques</li>
                <li>Application mobile pour accès hors ligne</li>
              </ul>
            </section>

            {/* Responsabilités */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Responsabilités des Utilisateurs</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations exactes</h3>
                  <p className="text-gray-600">Vous devez fournir des informations exactes et à jour lors de votre inscription</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Utilisation appropriée</h3>
                  <p className="text-gray-600">ACADEX doit être utilisé à des fins éducatives et conformément aux lois applicables</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sécurité du compte</h3>
                  <p className="text-gray-600">Vous êtes responsable de la sécurité de vos identifiants de connexion</p>
                </div>
              </div>
            </section>

            {/* Confidentialité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Confidentialité et Données</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous respectons votre vie privée et protégeons vos données personnelles conformément à :
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">RGPD et régulations applicables</span>
                </div>
                <p className="text-blue-800 text-sm">
                  Consultez notre Politique de Confidentialité pour en savoir plus sur la collecte, 
                  l'utilisation et la protection de vos données.
                </p>
              </div>
            </section>

            {/* Propriété Intellectuelle */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété Intellectuelle</h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <strong>Contenu ACADEX :</strong> La plateforme, son design, et son contenu sont la propriété d'ACADEX.
                </p>
                <p className="text-gray-600">
                  <strong>Contenu utilisateur :</strong> Vous conservez les droits sur votre contenu mais nous accordez 
                  une licence pour l'utiliser dans le cadre du service.
                </p>
                <p className="text-gray-600">
                  <strong>Utilisation interdite :</strong> Toute copie, modification ou distribution non autorisée est interdite.
                </p>
              </div>
            </section>

            {/* Paiements */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Tarifs et Paiements</h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <strong>Période d'essai :</strong> 30 jours gratuits avec toutes les fonctionnalités premium.
                </p>
                <p className="text-gray-600">
                  <strong>Abonnements :</strong> Mensuels ou annuels avec facturation automatique.
                </p>
                <p className="text-gray-600">
                  <strong>Résiliation :</strong> Annulation possible à tout moment sans frais supplémentaires.
                </p>
                <p className="text-gray-600">
                  <strong>Remboursements :</strong> Politique de remboursement de 14 jours pour les nouveaux abonnés.
                </p>
              </div>
            </section>

            {/* Limitation de Responsabilité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation de Responsabilité</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-900 font-semibold mb-2">Important</p>
                    <p className="text-yellow-800 text-sm">
                      ACADEX est fourni "en l'état". Nous ne garantissons pas une disponibilité à 100% 
                      et ne sommes pas responsables des pertes de données indirectes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Résiliation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Résiliation du Service</h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <strong>Résiliation par l'utilisateur :</strong> Vous pouvez résilier votre compte à tout moment.
                </p>
                <p className="text-gray-600">
                  <strong>Résiliation par ACADEX :</strong> Nous pouvons résilier les comptes en cas de violation des conditions.
                </p>
                <p className="text-gray-600">
                  <strong>Effet de la résiliation :</strong> Perte d'accès aux données et fonctionnalités.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications des Conditions</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous nous réservons le droit de modifier ces conditions. Les modifications seront notifiées 
                par email ou via la plateforme. L'utilisation continue après modification constitue une acceptation.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact et Support</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  Pour toute question concernant ces conditions :
                </p>
                <div className="space-y-1 text-gray-600">
                  <p><strong>Email :</strong> legal@acadx.app</p>
                  <p><strong>Téléphone :</strong> +33 1 234 567 890</p>
                  <p><strong>Adresse :</strong> 123 Rue de l'Éducation, 75001 Paris, France</p>
                </div>
              </div>
            </section>

            {/* Acceptation finale */}
            <section className="border-t pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  En utilisant ACADEX, vous confirmez avoir lu, compris et accepté ces conditions d'utilisation.
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/auth/register">
                    <Button className="acadex-primary text-white">
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="border-blue-600 text-blue-600">
                      Contacter le support
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
