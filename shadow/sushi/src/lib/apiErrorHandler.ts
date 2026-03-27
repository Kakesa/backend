/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// GESTIONNAIRE D'ERREURS API CENTRALISÉ
// ==========================================

import { toast } from "sonner";
import axios, { AxiosError } from "axios";

export type ApiErrorType =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server"
  | "timeout"
  | "unknown";

export interface ApiErrorDetails {
  type: ApiErrorType;
  status?: number;
  message: string;
  description: string;
  action?: string;
}

// Déterminer le type d'erreur à partir de la réponse
export function getApiErrorDetails(error: unknown): ApiErrorDetails {
  // Erreur réseau (pas de connexion)
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;

    // Pas de réponse = erreur réseau
    if (!axiosError.response) {
      if (
        axiosError.code === "ECONNABORTED" ||
        axiosError.message?.includes("timeout")
      ) {
        return {
          type: "timeout",
          message: "Délai d'attente dépassé",
          description:
            "Le serveur met trop de temps à répondre. Vérifiez votre connexion.",
          action: "Réessayer",
        };
      }
      return {
        type: "network",
        message: "Erreur de connexion",
        description:
          "Impossible de joindre le serveur. Vérifiez votre connexion internet.",
        action: "Vérifier la connexion",
      };
    }

    const status = axiosError.response.status;
    const serverMessage = axiosError.response.data?.message;

    switch (status) {
      case 401:
        return {
          type: "unauthorized",
          status,
          message: "Session expirée",
          description:
            serverMessage ||
            "Votre session a expiré. Veuillez vous reconnecter.",
          action: "Se reconnecter",
        };
      case 403: {
        const reason = (axiosError.response.data as any)?.reason;

        if (reason === "SCHOOL_DEACTIVATED") {
          return {
            type: "forbidden",
            status,
            message: "École désactivée",
            description:
              "Cette école a été désactivée par le super-administrateur. Veuillez contacter le support.",
            action: "Contacter le support",
          };
        }

        if (
          reason === "SUBSCRIPTION_EXPIRED" ||
          reason === "SUBSCRIPTION_INACTIVE"
        ) {
          return {
            type: "forbidden",
            status,
            message: "Abonnement expiré",
            description:
              "Votre période d'essai ou abonnement a expiré. Veuillez renouveler votre abonnement.",
            action: "Renouveler l'abonnement",
          };
        }

        return {
          type: "forbidden",
          status,
          message: "Accès refusé",
          description:
            serverMessage ||
            "Vous n'avez pas les permissions nécessaires pour cette action.",
          action: "Contacter l'administrateur",
        };
      }
      case 404:
        return {
          type: "not_found",
          status,
          message: "Ressource introuvable",
          description:
            serverMessage ||
            "L'élément demandé n'existe pas ou a été supprimé.",
          action: "Actualiser",
        };
      case 422:
        return {
          type: "validation",
          status,
          message: "Données invalides",
          description:
            serverMessage ||
            "Les données envoyées sont incorrectes. Vérifiez les champs.",
          action: "Corriger",
        };
      case 429:
        return {
          type: "server",
          status,
          message: "Trop de requêtes",
          description:
            "Vous avez effectué trop de requêtes. Veuillez patienter.",
          action: "Patienter",
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: "server",
          status,
          message: "Erreur serveur",
          description:
            serverMessage ||
            "Une erreur s'est produite côté serveur. Réessayez plus tard.",
          action: "Réessayer plus tard",
        };
      default:
        return {
          type: "unknown",
          status,
          message: "Erreur inattendue",
          description:
            serverMessage || `Une erreur s'est produite (code ${status}).`,
          action: "Réessayer",
        };
    }
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    return {
      type: "unknown",
      message: "Erreur",
      description: error.message || "Une erreur inattendue s'est produite.",
      action: "Réessayer",
    };
  }

  return {
    type: "unknown",
    message: "Erreur inconnue",
    description: "Une erreur inattendue s'est produite.",
    action: "Réessayer",
  };
}

// Afficher un toast avec le bon style selon le type d'erreur
export function showApiErrorToast(
  error: unknown,
  context?: string,
): ApiErrorDetails {
  const details = getApiErrorDetails(error);
  const prefix = context ? `${context}: ` : "";

  switch (details.type) {
    case "network":
    case "timeout":
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        icon: "🌐",
        duration: 5000,
      });
      break;
    case "unauthorized":
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        icon: "🔐",
        duration: 6000,
        action: {
          label: "Se reconnecter",
          onClick: () => (window.location.href = "/login"),
        },
      });
      break;
    case "forbidden":
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        icon: "🚫",
        duration: 5000,
      });
      break;
    case "not_found":
      toast.warning(`${prefix}${details.message}`, {
        description: details.description,
        icon: "🔍",
        duration: 4000,
      });
      break;
    case "validation":
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        icon: "⚠️",
        duration: 5000,
      });
      break;
    case "server":
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        icon: "🔧",
        duration: 6000,
      });
      break;
    default:
      toast.error(`${prefix}${details.message}`, {
        description: details.description,
        duration: 4000,
      });
  }

  return details;
}

// Toast de succès avec contexte
export function showApiSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
    icon: "✓",
    duration: 3000,
  });
}

// Toast d'information
export function showApiInfoToast(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 3000,
  });
}
