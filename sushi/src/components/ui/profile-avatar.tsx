import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { getProfilePhotoUrl, getDefaultPhotoUrl } from '@/services/api/profile.api';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  userType?: 'user' | 'student' | 'teacher' | 'parent';
  userId?: string;
  className?: string;
  fallback?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away';
  editable?: boolean;
  onEdit?: () => void;
}

export const ProfileAvatar = React.forwardRef<HTMLDivElement, ProfileAvatarProps>(
  ({ 
    src, 
    alt, 
    size = 'md', 
    userType = 'user',
    userId,
    className,
    fallback,
    showStatus = false,
    status = 'offline',
    editable = false,
    onEdit
  }, ref) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg'
    };

    const statusSizeClasses = {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4'
    };

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500'
    };

    // Générer l'URL complète de la photo
    const photoUrl = src && userId && userType && !imageError
      ? getProfilePhotoUrl(userType, userId)
      : getDefaultPhotoUrl();

    // Extraire les initiales pour le fallback
    const getInitials = (name?: string) => {
      if (!name) return '?';
      const names = name.split(' ');
      if (names.length >= 2) {
        return names[0][0] + names[names.length - 1][0];
      }
      return names[0]?.substring(0, 2) || '?';
    };

    const initials = fallback || getInitials(alt);

    const handleImageError = () => {
      setImageError(true);
      setIsLoading(false);
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    return (
      <div 
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-muted overflow-hidden flex-shrink-0 group',
          sizeClasses[size],
          editable && 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all',
          className
        )}
        onClick={editable ? onEdit : undefined}
      >
        <Avatar className="h-full w-full">
          {/* Image de profil */}
          {src && userId && !imageError ? (
            <AvatarImage 
              src={photoUrl}
              alt={alt || 'Profile'}
              className="h-full w-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : null}

          {/* Fallback avec initiales ou icône */}
          <AvatarFallback className="flex items-center justify-center h-full w-full">
            {initials && initials !== '?' ? (
              <span className="font-medium text-muted-foreground">
                {initials.toUpperCase()}
              </span>
            ) : (
              <User className="h-1/2 w-1/2 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="h-1/3 w-1/3 animate-pulse rounded-full bg-muted-foreground/20" />
          </div>
        )}

        {/* Indicateur d'édition */}
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-full p-1">
              <User className="h-3 w-3 text-gray-600" />
            </div>
          </div>
        )}

        {/* Indicateur de statut */}
        {showStatus && (
          <div 
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-background',
              statusSizeClasses[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

ProfileAvatar.displayName = 'ProfileAvatar';
