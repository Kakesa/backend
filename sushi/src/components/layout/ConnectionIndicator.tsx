 // ==========================================
 // COMPOSANT - Indicateur de connexion backend
 // ==========================================
 
 import React from "react";
 import { Wifi, WifiOff, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
 import { useConnectionStatus, ConnectionState } from "@/hooks/useConnectionStatus";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 const statusConfig: Record<ConnectionState, {
   icon: React.ElementType;
   color: string;
   bgColor: string;
   pulseColor: string;
   label: string;
   description: string;
 }> = {
   connected: {
     icon: Wifi,
     color: "text-emerald-500",
     bgColor: "bg-emerald-500/20",
     pulseColor: "bg-emerald-500",
     label: "Connecté",
     description: "Connexion au serveur établie",
   },
   disconnected: {
     icon: WifiOff,
     color: "text-destructive",
     bgColor: "bg-destructive/20",
     pulseColor: "bg-destructive",
     label: "Déconnecté",
     description: "Impossible de joindre le serveur",
   },
   checking: {
     icon: Loader2,
     color: "text-muted-foreground",
     bgColor: "bg-muted",
     pulseColor: "bg-muted-foreground",
     label: "Vérification...",
     description: "Test de la connexion en cours",
   },
   slow: {
     icon: AlertTriangle,
     color: "text-amber-500",
     bgColor: "bg-amber-500/20",
     pulseColor: "bg-amber-500",
     label: "Connexion lente",
     description: "Le serveur répond lentement",
   },
 };
 
 export const ConnectionIndicator: React.FC = () => {
   const { status, latency, lastCheck, checkNow } = useConnectionStatus();
   const config = statusConfig[status];
   const Icon = config.icon;
 
   const formatLatency = (ms: number | null) => {
     if (ms === null) return "—";
     if (ms < 1000) return `${ms}ms`;
     return `${(ms / 1000).toFixed(1)}s`;
   };
 
   const formatLastCheck = (date: Date | null) => {
     if (!date) return "Jamais";
     const now = new Date();
     const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
     
     if (diffSeconds < 10) return "À l'instant";
     if (diffSeconds < 60) return `Il y a ${diffSeconds}s`;
     if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)}min`;
     return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
   };
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <Button
             variant="ghost"
             size="sm"
             className={cn(
               "relative gap-2 px-2 sm:px-3 h-8 sm:h-9",
               config.bgColor,
               "hover:opacity-80 transition-opacity"
             )}
             onClick={checkNow}
           >
             {/* Indicateur LED avec pulse */}
             <span className="relative flex h-2 w-2">
               {status === "connected" && (
                 <span
                   className={cn(
                     "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                     config.pulseColor
                   )}
                 />
               )}
               <span
                 className={cn(
                   "relative inline-flex rounded-full h-2 w-2",
                   config.pulseColor
                 )}
               />
             </span>
 
             {/* Icône */}
             <Icon
               className={cn(
                 "h-3.5 w-3.5 sm:h-4 sm:w-4",
                 config.color,
                 status === "checking" && "animate-spin"
               )}
             />
 
             {/* Label (desktop only) */}
             <span className={cn("hidden sm:inline text-xs font-medium", config.color)}>
               {config.label}
             </span>
 
             {/* Latence (desktop only) */}
             {latency !== null && status !== "checking" && (
               <span className="hidden md:inline text-xs text-muted-foreground">
                 ({formatLatency(latency)})
               </span>
             )}
           </Button>
         </TooltipTrigger>
         <TooltipContent side="bottom" className="max-w-xs">
           <div className="space-y-2">
             <div className="flex items-center gap-2">
               <Icon className={cn("h-4 w-4", config.color)} />
               <span className="font-medium">{config.label}</span>
             </div>
             <p className="text-xs text-muted-foreground">{config.description}</p>
             
             <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
               <div>
                 <span className="text-muted-foreground">Latence:</span>
                 <span className="ml-1 font-medium">{formatLatency(latency)}</span>
               </div>
               <div>
                 <span className="text-muted-foreground">Vérifié:</span>
                 <span className="ml-1 font-medium">{formatLastCheck(lastCheck)}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
               <RefreshCw className="h-3 w-3" />
               <span>Cliquez pour rafraîchir</span>
             </div>
           </div>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 };