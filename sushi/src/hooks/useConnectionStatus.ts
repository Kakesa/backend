 // ==========================================
 // HOOK - Statut de connexion backend en temps réel
 // ==========================================
 
 import { useState, useEffect, useCallback, useRef } from "react";
 import { api } from "@/services/api/client";
 
 export type ConnectionState = "connected" | "disconnected" | "checking" | "slow";
 
 interface ConnectionStatusResult {
   status: ConnectionState;
   latency: number | null;
   lastCheck: Date | null;
   checkNow: () => void;
 }
 
 const PING_INTERVAL = 30000; // 30 secondes
 const SLOW_THRESHOLD = 2000; // 2 secondes = connexion lente
 const TIMEOUT = 10000; // 10 secondes timeout
 
 export function useConnectionStatus(): ConnectionStatusResult {
   const [status, setStatus] = useState<ConnectionState>("checking");
   const [latency, setLatency] = useState<number | null>(null);
   const [lastCheck, setLastCheck] = useState<Date | null>(null);
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
 
   const checkConnection = useCallback(async () => {
     setStatus("checking");
     const startTime = Date.now();
 
     try {
       // Utilise l'endpoint stats comme ping (léger)
       await api.get("/superadmin/stats", { timeout: TIMEOUT });
       
       const responseTime = Date.now() - startTime;
       setLatency(responseTime);
       setLastCheck(new Date());
 
       if (responseTime > SLOW_THRESHOLD) {
         setStatus("slow");
       } else {
         setStatus("connected");
       }
     } catch {
       setLatency(null);
       setLastCheck(new Date());
       setStatus("disconnected");
     }
   }, []);
 
   useEffect(() => {
     // Vérification initiale
     checkConnection();
 
     // Vérification périodique
     intervalRef.current = setInterval(checkConnection, PING_INTERVAL);
 
     return () => {
       if (intervalRef.current) {
         clearInterval(intervalRef.current);
       }
     };
   }, [checkConnection]);
 
   // Écoute les événements réseau du navigateur
   useEffect(() => {
     const handleOnline = () => checkConnection();
     const handleOffline = () => setStatus("disconnected");
 
     window.addEventListener("online", handleOnline);
     window.addEventListener("offline", handleOffline);
 
     return () => {
       window.removeEventListener("online", handleOnline);
       window.removeEventListener("offline", handleOffline);
     };
   }, [checkConnection]);
 
   return {
     status,
     latency,
     lastCheck,
     checkNow: checkConnection,
   };
 }