// Couleurs principales ACADEX
export const acadexColors = {
  // Couleur principale
  primary: '#388bcf',
  
  // Variations de la couleur principale
  primaryLight: '#5ba3e6',
  primaryDark: '#2b7bb8',
  primaryDarker: '#1e5d8a',
  
  // Gradients ACADEX
  gradients: {
    primary: 'from-blue-500 to-blue-700',
    primaryLight: 'from-blue-400 to-blue-600',
    primaryDark: 'from-blue-600 to-blue-800',
    primaryDarker: 'from-blue-700 to-blue-900',
    
    // Gradients spécifiques par fonctionnalité
    library: 'from-blue-500 to-cyan-600',
    notes: 'from-blue-400 to-indigo-500',
    courses: 'from-blue-500 to-purple-600',
    offline: 'from-slate-500 to-gray-600',
    mobile: 'from-blue-500 to-blue-700',
    
    // Gradients pour les rôles
    admin: 'from-blue-600 to-blue-800',
    teacher: 'from-emerald-500 to-teal-600',
    parent: 'from-purple-500 to-indigo-600',
    student: 'from-orange-500 to-red-600'
  },
  
  // Couleurs de fond
  backgrounds: {
    primary: 'from-blue-50 to-blue-100',
    primaryDark: 'from-blue-900/20 to-blue-800/20',
    light: 'from-gray-50 to-gray-100',
    dark: 'from-gray-800 to-gray-900'
  },
  
  // Couleurs de texte
  text: {
    primary: 'text-blue-600',
    primaryDark: 'text-blue-400',
    light: 'text-gray-600',
    dark: 'text-gray-300'
  },
  
  // Couleurs de bordure
  borders: {
    primary: 'border-blue-500',
    primaryLight: 'border-blue-300',
    primaryDark: 'border-blue-700'
  }
};

// Thème complet ACADEX
export const acadexTheme = {
  colors: acadexColors,
  
  // Espacements responsive
  spacing: {
    section: {
      mobile: 'py-12',
      tablet: 'py-16',
      desktop: 'py-20'
    },
    container: {
      mobile: 'px-4',
      tablet: 'px-6',
      desktop: 'px-4'
    }
  },
  
  // Tailles de texte responsive
  typography: {
    headings: {
      h1: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
      h2: 'text-2xl sm:text-3xl lg:text-4xl',
      h3: 'text-xl sm:text-2xl lg:text-3xl'
    },
    body: {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xl: 'text-xl'
    }
  },
  
  // Animations
  animations: {
    fadeIn: 'animate-fade-in-up',
    hover: 'transform hover:-translate-y-2 transition-all duration-300',
    scale: 'transform hover:scale-105 transition-all duration-200'
  }
};
