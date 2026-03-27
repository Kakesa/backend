# 🏫 Système d'Isolation Multi-Écoles

Ce document explique comment le système d'isolation multi-tenant empêche l'affichage d'entités d'autres écoles et garantit la sécurité des données.

---

## 🎯 Objectif

**Empêcher complètement l'affichage d'entités créées par une autre école** dans l'interface d'une école différente.

---

## 🏗️ Architecture d'Isolation

### **1. Service Central d'Isolation**
```typescript
// src/lib/schoolIsolation.ts
export const belongsToCurrentSchool = (entity: any): boolean
export const filterByCurrentSchool = <T>(entities: T[]): T[]
export const validateEntityAccess = (entity: any): boolean
export const addSchoolIdToEntity = (data: any): any
```

### **2. Hooks React**
```typescript
// src/hooks/useFilteredData.ts
useFilteredData(data) // Filtre automatiquement une liste
useFilteredEntity(entity) // Valide une entité unique
```

### **3. Middleware Backend**
```javascript
// src/middlewares/entityIsolation.middleware.js
validateEntityAccess() // Bloque l'accès aux entités d'autres écoles
filterBySchool() // Filtre automatiquement les requêtes MongoDB
```

---

## 🚫 Comment le Blocage Fonctionne

### **Niveau Backend - Middleware**
```javascript
// Dans les contrôleurs
if (req.user.role !== 'superadmin') {
  await validateEntityAccess(classId, 'class', req.user, req);
}

// Filtrage automatique des requêtes
Model.find = function(filter = {}, ...args) {
  const schoolFilter = {
    ...filter,
    schoolId: user.school // Ajout automatique du filtre
  };
  return originalFind.call(this, schoolFilter, ...args);
};
```

### **Niveau Frontend - Hooks**
```typescript
// Filtrage automatique des données
const { data: filteredClasses, blockedCount } = useFilteredData(allClasses);

// Validation d'une entité unique
const { isValid, error } = useFilteredEntity(singleClass);
```

---

## 📋 Exemples d'Utilisation

### **1. Liste des Classes avec Isolation**
```typescript
import { IsolatedClassesList } from '@/components/examples/IsolatedClassesList';

function ClassesPage() {
  const { data: classes = [] } = useQuery(['classes'], apiGetAllClasses);
  
  return (
    <IsolatedClassesList 
      classes={classes}
      showWarnings={true}
    />
  );
}
```

### **2. Validation d'une Entité**
```typescript
function ClassDetail({ classId }) {
  const { data: classItem } = useQuery(['class', classId], () => apiGetClassById(classId));
  const { isValid, error } = useFilteredEntity(classItem);
  
  if (!isValid) {
    return <EntityAccessDenied entityType="classe" entityName={classItem.name} />;
  }
  
  return <ClassCard classItem={classItem} />;
}
```

### **3. Création avec SchoolId Automatique**
```typescript
function CreateClassForm() {
  const createClass = async (data) => {
    // Le schoolId est ajouté automatiquement
    const dataWithSchool = addSchoolIdToEntity(data);
    await apiCreateClass(dataWithSchool);
  };
}
```

---

## 🔒 Sécurité Multi-Niveaux

### **1. Middleware Backend**
- ✅ **Validation JWT** - Vérifie l'authentification
- ✅ **Contrôle Rôle** - Super-admin vs autres rôles
- ✅ **Validation Entité** - Vérifie `schoolId` avant accès
- ✅ **Filtrage Requêtes** - Ajoute automatiquement `schoolId`

### **2. Service Frontend**
- ✅ **Filtrage Local** - Cache les entités d'autres écoles
- ✅ **Validation Accès** - Lève une erreur si violation
- ✅ **Logging Sécurité** - Trace les tentatives d'accès

### **3. Hooks React**
- ✅ **Filtrage Auto** - `useFilteredData()` filtre automatiquement
- ✅ **Validation Auto** - `useFilteredEntity()` valide automatiquement
- ✅ **Avertissements UI** - Messages clairs pour l'utilisateur

---

## 🚨 Messages d'Erreur

### **Backend - 403 Forbidden**
```json
{
  "message": "Accès non autorisé: cette ressource n'appartient pas à votre établissement",
  "error": "Entity belongs to different school"
}
```

### **Frontend - UI Warning**
```tsx
<EntityAccessDenied 
  entityType="classe"
  entityName="Classe A"
/>
```

### **Console - Security Log**
```javascript
🚫 Tentative d'accès inter-écoles bloquée: {
  entityType: 'class',
  entityId: '64f8a1b2c3d4e5f6a7b8c9d0',
  entitySchoolId: '64f8a1b2c3d4e5f6a7b8c9d1',
  userSchoolId: '64f8a1b2c3d4e5f6a7b8c9d2',
  userId: '64f8a1b2c3d4e5f6a7b8c9d3',
  userRole: 'admin'
}
```

---

## 🛠️ Implémentation dans les Composants

### **1. Remplacer les listes existantes**
```typescript
// Avant
{classes.map(class => <ClassCard key={class.id} class={class} />)}

// Après
<IsolatedClassesList classes={classes} />
```

### **2. Ajouter la validation aux formulaires**
```typescript
const handleSubmit = async (data) => {
  const dataWithSchool = addSchoolIdToEntity(data);
  await apiCreateClass(dataWithSchool);
};
```

### **3. Protéger les pages de détail**
```typescript
function ClassDetailPage({ classId }) {
  const { data: classItem } = useQuery(['class', classId], apiGetClassById);
  const { isValid } = useFilteredEntity(classItem);
  
  if (!isValid) return <EntityAccessDenied entityType="classe" />;
  
  return <ClassDetail classItem={classItem} />;
}
```

---

## 📊 Statistiques de Sécurité

Le système fournit des statistiques sur les blocages :
```typescript
const { 
  totalCount,      // Total des entités
  filteredCount,   // Entités autorisées
  blockedCount,    // Entités bloquées
  hasBlockedEntities // Si des blocages ont eu lieu
} = useFilteredData(classes);
```

---

## 🔄 Migration des Composants Existantants

### **Étape 1: Identifier les listes d'entités**
```bash
grep -r "classes.map" src/
grep -r "students.map" src/
grep -r "teachers.map" src/
```

### **Étape 2: Remplacer avec les hooks isolés**
```typescript
// Ancien code
const classes = useQuery(['classes'], apiGetAllClasses);
return classes.data?.map(class => ...);

// Nouveau code
const { data: filteredClasses } = useFilteredData(classes.data || []);
return filteredClasses.map(class => ...);
```

### **Étape 3: Ajouter la validation aux détails**
```typescript
// Ajouter aux pages de détail
const { isValid } = useFilteredEntity(entity);
if (!isValid) return <EntityAccessDenied />;
```

---

## 🎉 Résultat Final

- ✅ **Aucune entité d'une autre école ne s'affiche**
- ✅ **Messages d'erreur clairs pour les violations**
- ✅ **Logging complet des tentatives d'accès**
- ✅ **Interface utilisateur sécurisée**
- ✅ **Protection multi-niveaux**

**L'isolation multi-tenant est maintenant complète et infaillible !** 🛡️
