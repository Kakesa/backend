import { cn } from "@/lib/utils";
import React from "react";

interface ContentTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  className?: string;
}

/**
 * A component that provides smooth transition between skeleton loading state and actual content.
 * Uses CSS transitions for a fluid, professional appearance.
 */
export function ContentTransition({
  isLoading,
  children,
  skeleton,
  className,
}: ContentTransitionProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Skeleton layer */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          isLoading
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform -translate-y-2 pointer-events-none absolute inset-0"
        )}
      >
        {skeleton}
      </div>
      
      {/* Content layer */}
      <div
        className={cn(
          "transition-all duration-500 ease-out delay-100",
          isLoading
            ? "opacity-0 transform translate-y-4"
            : "opacity-100 transform translate-y-0"
        )}
      >
        {!isLoading && children}
      </div>
    </div>
  );
}

/**
 * A simpler fade-in wrapper for content that appears after loading
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-fade-in", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered fade-in for lists of items
 */
export function StaggeredList({
  children,
  baseDelay = 0,
  staggerDelay = 50,
  className,
}: {
  children: React.ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in"
          style={{ animationDelay: `${baseDelay + index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
