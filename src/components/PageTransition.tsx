import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slide" | "scale" | "fade-up";
  delay?: number;
}

export const PageTransition = ({ 
  children, 
  className,
  variant = "fade-up",
  delay = 0
}: PageTransitionProps) => {
  const variants = {
    fade: "animate-fade-in",
    "fade-up": "animate-fade-in",
    slide: "animate-slide-in-right",
    scale: "animate-scale-in"
  };

  return (
    <div 
      className={cn(variants[variant], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface StaggeredChildrenProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  variant?: "fade" | "slide" | "scale" | "fade-up";
}

export const StaggeredChildren = ({
  children,
  className,
  staggerDelay = 50,
  variant = "fade-up"
}: StaggeredChildrenProps) => {
  const variants = {
    fade: "animate-fade-in",
    "fade-up": "animate-fade-in",
    slide: "animate-slide-in-right",
    scale: "animate-scale-in"
  };

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={variants[variant]}
          style={{ 
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: "both"
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
