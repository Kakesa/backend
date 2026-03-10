# Installation des fonctionnalités de gestion des frais

## Dépendances additionnelles

Ajoutez ces dépendances à votre projet backend :

```bash
npm install pdfkit cron node-cron
```

## Mise à jour des modèles

### 1. Mettre à jour le modèle StudentFee

Ajoutez ces champs au modèle `StudentFee` :

```javascript
// Dans src/modules/fees/fee.model.js
const studentFeeSchema = new mongoose.Schema({
    // ... champs existants
    lastReminderDate: {
        type: Date,
        default: null
    }
});
```

### 2. Importer le modèle PaymentPlan

Ajoutez au début du fichier `payment.controller.js` :

```javascript
const PaymentPlan = require('./paymentPlan.model');
```

## Nouvelles routes

Les routes suivantes ont été ajoutées automatiquement :

### Payments
- `GET /api/payments/history` - Historique des paiements
- `GET /api/payments/receipt/:paymentId` - Télécharger reçu PDF
- `POST /api/payments/plans` - Créer un plan de paiement
- `GET /api/payments/plans` - Lister les plans de paiement

### Fees
- `GET /api/fees/reminder-stats` - Statistiques des rappels
- `POST /api/fees/auto-reminders` - Déclencher les rappels automatiques

## Configuration du Cron Job

Ajoutez ce code dans votre fichier principal `server.js` ou `app.js` :

```javascript
const cron = require('node-cron');
const { runFeeReminderJob } = require('./src/jobs/feeReminderJob');

// Exécuter tous les jours à 9h00 du matin
cron.schedule('0 9 * * *', async () => {
    try {
        await runFeeReminderJob();
    } catch (error) {
        console.error('Error in scheduled fee reminder job:', error);
    }
});

console.log('📅 Fee reminder job scheduled to run daily at 9:00 AM');
```

## Variables d'environnement

Assurez-vous d'avoir ces variables dans votre `.env` :

```env
# URL de base pour les webhooks et callbacks
BACKEND_URL=http://localhost:5000

# Configuration des emails (si utilisé pour les notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Test des endpoints

### Historique des paiements
```bash
curl -X GET "http://localhost:5000/api/payments/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Télécharger un reçu PDF
```bash
curl -X GET "http://localhost:5000/api/payments/receipt/PAYMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o receipt.pdf
```

### Créer un plan de paiement
```bash
curl -X POST "http://localhost:5000/api/payments/plans" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentFeeId": "FEE_ID",
    "installments": [
      {
        "dueDate": "2024-02-01",
        "amount": 50,
        "description": "Première échéance"
      },
      {
        "dueDate": "2024-03-01", 
        "amount": 50,
        "description": "Deuxième échéance"
      }
    ]
  }'
```

### Déclencher les rappels automatiques
```bash
curl -X POST "http://localhost:5000/api/fees/auto-reminders" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Fonctionnalités ajoutées

### ✅ Historique des paiements
- Liste complète des paiements avec filtres
- Téléchargement de reçus PDF
- Support de toutes les méthodes de paiement

### ✅ Plans de paiement échelonnés
- Création de plans personnalisés
- Suivi des échéances
- Statuts automatiques (Actif, Terminé, Annulé)

### ✅ Rappels automatiques
- Rappels intelligents basés sur les dates d'échéance
- Notifications automatiques aux parents
- Statistiques des rappels
- Job planifié quotidien

### ✅ Reçus PDF
- Génération automatique des reçus
- Format professionnel avec toutes les informations
- Téléchargement direct

## Sécurité

- Toutes les routes sont protégées par authentification
- Vérification des autorisations parent-enfant
- Validation des montants et dates
- Protection contre les accès non autorisés

## Support

Pour toute question sur l'implémentation, consultez la documentation ou contactez l'équipe de développement.
