 // ==========================================
 // CONTEXTE - État de chargement global
 // ==========================================
 
 import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
 
 interface LoadingState {
   isLoading: boolean;
   message?: string;
   progress?: number; // 0-100
 }
 
 interface LoadingContextType {
   loadingState: LoadingState;
   startLoading: (message?: string) => void;
   stopLoading: () => void;
   setProgress: (progress: number) => void;
   setMessage: (message: string) => void;
 }
 
 const LoadingContext = createContext<LoadingContextType | undefined>(undefined);
 
 export const useLoading = () => {
   const context = useContext(LoadingContext);
   if (!context) {
     throw new Error("useLoading must be used within a LoadingProvider");
   }
   return context;
 };
 
 interface LoadingProviderProps {
   children: ReactNode;
 }
 
 export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
   const [loadingState, setLoadingState] = useState<LoadingState>({
     isLoading: false,
   });
 
   const startLoading = useCallback((message?: string) => {
     setLoadingState({ isLoading: true, message, progress: undefined });
   }, []);
 
   const stopLoading = useCallback(() => {
     setLoadingState({ isLoading: false, message: undefined, progress: undefined });
   }, []);
 
   const setProgress = useCallback((progress: number) => {
     setLoadingState((prev) => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
   }, []);
 
   const setMessage = useCallback((message: string) => {
     setLoadingState((prev) => ({ ...prev, message }));
   }, []);
 
   return (
     <LoadingContext.Provider
       value={{
         loadingState,
         startLoading,
         stopLoading,
         setProgress,
         setMessage,
       }}
     >
       {children}
     </LoadingContext.Provider>
   );
 };