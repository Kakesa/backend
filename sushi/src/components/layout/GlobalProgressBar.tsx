 // ==========================================
 // COMPOSANT - Barre de progression globale
 // ==========================================
 
 import React, { useEffect, useState } from "react";
 import { cn } from "@/lib/utils";
 import { useLoading } from "@/contexts/LoadingContext";
 import { Loader2 } from "lucide-react";
 
 export const GlobalProgressBar: React.FC = () => {
   const { loadingState } = useLoading();
   const [visible, setVisible] = useState(false);
   const [progress, setProgress] = useState(0);
 
   useEffect(() => {
     if (loadingState.isLoading) {
       setVisible(true);
       // Animation de progression automatique si pas de progression définie
       if (loadingState.progress === undefined) {
         setProgress(0);
         const interval = setInterval(() => {
           setProgress((prev) => {
             // Progression exponentielle décroissante (ne dépasse jamais 90%)
             if (prev >= 90) return prev;
             return prev + (90 - prev) * 0.1;
           });
         }, 200);
         return () => clearInterval(interval);
       } else {
         setProgress(loadingState.progress);
       }
     } else {
       // Compléter la barre avant de la masquer
       setProgress(100);
       const timeout = setTimeout(() => {
         setVisible(false);
         setProgress(0);
       }, 300);
       return () => clearTimeout(timeout);
     }
   }, [loadingState.isLoading, loadingState.progress]);
 
   if (!visible) return null;
 
   return (
     <div className="fixed top-0 left-0 right-0 z-[100]">
       {/* Barre principale */}
       <div className="h-1 w-full bg-primary/10 overflow-hidden">
         <div
           className={cn(
             "h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out",
             "relative"
           )}
           style={{ width: `${progress}%` }}
         >
           {/* Effet de brillance */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
         </div>
       </div>
 
       {/* Message optionnel avec indicateur */}
       {loadingState.message && (
         <div className="absolute top-2 left-1/2 -translate-x-1/2 animate-fade-in">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/95 backdrop-blur border shadow-lg">
             <Loader2 className="h-4 w-4 animate-spin text-primary" />
             <span className="text-sm font-medium">{loadingState.message}</span>
             {loadingState.progress !== undefined && (
               <span className="text-xs text-muted-foreground">
                 {Math.round(loadingState.progress)}%
               </span>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 // Animation shimmer pour Tailwind
 // Ajouter dans tailwind.config.ts si pas présent:
 // animation: { shimmer: "shimmer 2s infinite" }
 // keyframes: { shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } } }