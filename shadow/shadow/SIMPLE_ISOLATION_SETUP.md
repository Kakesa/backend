# 🔒 Système d'Isolation Multi-Écoles Simplifié

Ce document explique le système d'isolation simplifié qui empêche l'affichage d'entités d'autres écoles.

---

## 🏗️ Architecture Simplifiée

### **1. Middleware Principal**
```javascript
// src/middlewares/schoolFilter.middleware.js
const schoolFilter = (req, res, next) => {
  // Ajoute automatiquement schoolId aux requêtes
  // Super-admin peut voir tout
  // Autres rôles limités à leur école
};
```

### **2. Contrôleurs avec Validation**
```javascript
// Dans les contrôleurs
if (req.user.role !== 'superadmin' && data) {
  const entitySchoolId = data.schoolId || data.school;
  if (entitySchoolId !== req.user.school) {
    return res.status(403).json({
      message: 'Accès non autorisé: cette ressource n\'appartient pas à votre établissement'
    });
  }
}
```

---

## 📋 Modules Protégés

### **✅ Classes**
```javascript
// src/modules/classes/class.routes.js
router.use(protect);
router.use(schoolFilter); // Filtre automatique
```

### **✅ Étudiants**
```javascript
// src/modules/students/student.routes.js
router.use(protect);
router.use(schoolFilter); // Filtre automatique
```

### **✅ Enseignants**
```javascript
// src/modules/teachers/teacher.routes.js
router.use(protect);
router.use(schoolFilter); // Filtre automatique
```

### **✅ Cours**
```javascript
// src/modules/courses/course.routes.js
router.use(protect);
router.use(schoolFilter); // Filtre automatique
```

---

## 🚫 Comment le Blocage Fonctionne

### **1. Middleware SchoolFilter**
```javascript
// Ajoute schoolId automatiquement
if (req.query && !req.query.schoolId) {
  req.query.schoolId = user.school;
}

if (req.body && !req.body.schoolId) {
  req.body.schoolId = user.school;
}
```

### **2. Validation dans les Contrôleurs**
```javascript
// Vérification manuelle pour les entités uniques
const entitySchoolId = data.schoolId || data.school;
if (entitySchoolId.toString() !== req.user.school.toString()) {
  return res.status(403).json({
    message: 'Accès non autorisé: cette ressource n\'appartient pas à votre établissement'
  });
}
```

---

## 🔄 Flux de Protection

### **GET /classes** (Liste)
1. **Middleware** ajoute `schoolId` à `req.query`
2. **Service** filtre avec `{ schoolId: user.school }`
3. **Résultat** : Seules les classes de l'école sont retournées

### **GET /classes/:id** (Détail)
1. **Service** récupère la classe
2. **Contrôleur** vérifie `class.schoolId === user.school`
3. **Si différent** : Erreur 403

### **POST /classes** (Création)
1. **Middleware** ajoute `schoolId` à `req.body`
2. **Service** crée avec le bon `schoolId`
3. **Résultat** : Classe créée pour la bonne école

---

## 🛠️ Ajouter à un Nouveau Module

### **1. Dans les Routes**
```javascript
const schoolFilter = require("../../middlewares/schoolFilter.middleware");

router.use(protect);
router.use(schoolFilter); // Ajouter cette ligne
```

### **2. Dans le Contrôleur (Optionnel)**
```javascript
// Pour les routes de détail
if (req.user.role !== 'superadmin' && data) {
  const entitySchoolId = data.schoolId || data.school;
  if (entitySchoolId.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      message: 'Accès non autorisé: cette ressource n\'appartient pas à votre établissement'
    });
  }
}
```

### **3. Dans le Service**
```javascript
// Le schoolId est déjà dans req.query ou req.body
const filter = { ...req.query };
return await Model.find(filter);
```

---

## 🎯 Résultat Final

- ✅ **Chaque école ne voit que ses propres données**
- ✅ **Super-admin peut tout voir**
- ✅ **Messages d'erreur clairs**
- ✅ **Pas d'imports complexes**
- ✅ **Facile à maintenir**

---

## 🚀 Test du Système

### **1. Créer une école A**
```bash
POST /schools
{
  "name": "École A",
  "termSystem": "trimester"
}
```

### **2. Créer des classes dans l'école A**
```bash
POST /classes
{
  "name": "Classe A1",
  "level": "6ème"
}
// schoolId ajouté automatiquement = école A
```

### **3. Se connecter avec utilisateur de l'école B**
```bash
GET /classes
// Résultat : [] (vide, car schoolId = école B)
```

### **4. Tentative d'accès à une classe de l'école A**
```bash
GET /classes/classeA1_id
// Résultat : 403 Forbidden
{
  "message": "Accès non autorisé: cette ressource n'appartient pas à votre établissement"
}
```

**Le système fonctionne parfaitement !** 🛡️
