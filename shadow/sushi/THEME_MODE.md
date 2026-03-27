# Mode Dark / Thème Sombre

## 🌙 Présentation

Le projet Scholar Buddy Link dispose maintenant d'un mode dark complet avec support pour trois thèmes :
- **Clair** : Thème par défaut avec fond blanc
- **Sombre** : Thème dark avec fond noir/gris foncé  
- **Système** : Suit automatiquement les préférences du système d'exploitation

## 🎨 Caractéristiques

### Couleurs et Design
- **Palette cohérente** : Tous les composants utilisent des couleurs CSS variables
- **Contraste optimal** : Texte lisible dans les deux modes
- **Transitions fluides** : Changements de thème avec animations douces
- **Support complet** : Tous les espaces (élève, parent, professeur, admin)

### Composants UI
- **Cartes** : Fond adapté avec bordures subtiles
- **Boutons** : États hover et focus adaptés
- **Badges** : Couleurs optimisées pour chaque thème
- **Tableaux** : Lignes alternées pour meilleure lisibilité
- **Formulaires** : Champs de saisie adaptés

## 🛠️ Implémentation Technique

### Structure des fichiers
```
src/
├── contexts/
│   └── ThemeContext.tsx          # Provider de thème
├── components/ui/
│   ├── theme-toggle.tsx         # Bouton toggle simple
│   └── theme-dropdown.tsx       # Menu déroulant complet
├── lib/
├── index.css                    # Variables CSS des thèmes
└── tailwind.config.ts           # Configuration Tailwind
```

### Variables CSS
Les couleurs sont définies en HSL dans `index.css` :
```css
:root {
  --background: 209 40% 96%;     /* Light mode */
  --foreground: 222 47% 11%;
}

.dark {
  --background: 222 47% 11%;     /* Dark mode */
  --foreground: 210 40% 98%;
}
```

### Configuration Tailwind
```ts
export default {
  darkMode: ["class"],  // Active le mode dark avec la classe .dark
  // ...
}
```

## 📱 Utilisation

### Pour les utilisateurs
1. **Accéder aux contrôles de thème** : Dans la barre supérieure de chaque espace
2. **Choisir le thème** : 
   - ☀️ **Clair** : Pour une utilisation diurne
   - 🌙 **Sombre** : Pour une utilisation nocturne
   - 💻 **Système** : Suit les préférences de l'OS

### Pour les développeurs

#### Utiliser le hook `useTheme`
```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Thème actuel : {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Passer en mode sombre
      </button>
    </div>
  );
}
```

#### Styles conditionnels avec Tailwind
```tsx
<div className="bg-background text-foreground border-border">
  {/* S'adapte automatiquement au thème */}
</div>

<div className="dark:bg-gray-900 light:bg-white">
  {/* Styles spécifiques selon le thème */}
</div>
```

#### Composants de thème
```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeDropdown } from "@/components/ui/theme-dropdown";

// Toggle simple (icone uniquement)
<ThemeToggle />

// Menu déroulant complet (3 options)
<ThemeDropdown />
```

## 🎯 Intégration dans les layouts

Le thème est intégré dans tous les layouts principaux :

### DashboardLayout (Admin/SuperAdmin)
- Positionné dans la barre supérieure à droite
- À côté des notifications et du sélecteur de langue

### StudentLayout (Élèves)  
- Dans le header à droite
- Avec le centre de notifications

### TeacherLayout (Professeurs)
- Dans la barre supérieure
- À côté des notifications

### ParentLayout (Parents)
- Dans le header mobile/desktop
- Avec les notifications parentales

## 🔧 Personnalisation

### Ajouter de nouvelles couleurs
1. Modifier `index.css` :
```css
:root {
  --ma-couleur: 200 100% 50%;
}

.dark {
  --ma-couleur: 200 100% 60%;
}
```

2. Ajouter à `tailwind.config.ts` :
```ts
colors: {
  maCouleur: 'hsl(var(--ma-couleur))',
}
```

### Créer des variantes de composants
```tsx
const Button = ({ variant = "default", ...props }) => (
  <button 
    className={cn(
      "px-4 py-2 rounded",
      variant === "primary" && "bg-primary text-primary-foreground",
      variant === "secondary" && "bg-secondary text-secondary-foreground",
      // S'adapte automatiquement au thème
    )}
    {...props}
  />
);
```

## 🚀 Bonnes pratiques

### Développement
- **Toujours utiliser les variables CSS** : Évitez les couleurs hardcodées
- **Tester dans les deux thèmes** : Vérifiez le rendu light/dark
- **Utiliser les classes Tailwind** : `bg-background`, `text-foreground`, etc.
- **Penser au contraste** : Assurez-vous que le texte reste lisible

### Accessibilité
- **Respecter les ratios de contraste** : WCAG AA minimum
- **Préférences utilisateur** : Le mode système par défaut
- **Animations réduites** : Respecter `prefers-reduced-motion`

### Performance
- **Transitions CSS légères** : Évitez les animations lourdes
- **Changement de thème instantané** : Pas de rechargement nécessaire
- **LocalStorage** : Sauvegarde automatique des préférences

## 🐛 Dépannage

### Problèmes courants
- **Le thème ne s'applique pas** : Vérifiez que `ThemeProvider` enveloppe l'app
- **Couleurs incorrectes** : Assurez-vous d'utiliser les variables CSS
- **Layout cassé en dark** : Vérifiez les classes `dark:` manquantes

### Debug
```tsx
// Vérifier le thème actuel
console.log(document.documentElement.classList.contains('dark'));

// Forcer un thème
document.documentElement.classList.add('dark');
```

## 📈 Évolutions futures

- **Thèmes personnalisés** : Plusieurs palettes de couleurs
- **Mode haute contraste** : Pour l'accessibilité
- **Thèmes automatiques** : Selon l'heure de la journée
- **Personnalisation utilisateur** : Choix des couleurs

---

## 🎉 Conclusion

Le mode dark est maintenant entièrement fonctionnel et intégré à tous les espaces de l'application. Les utilisateurs peuvent choisir leur thème préféré et les développeurs peuvent facilement créer de nouveaux composants qui s'adaptent automatiquement au thème sélectionné.

Pour toute question ou amélioration, n'hésitez pas à consulter la documentation technique ou à contacter l'équipe de développement.
