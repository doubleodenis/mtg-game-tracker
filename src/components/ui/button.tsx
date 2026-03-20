import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: "#a855f7",
    color: "#ffffff",
    boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#a1a1aa",
  },
  outline: {
    backgroundColor: "transparent",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  destructive: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  default: {
    height: "2.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
  },
  sm: {
    height: "2rem",
    padding: "0.25rem 0.75rem",
    fontSize: "0.75rem",
  },
  lg: {
    height: "3rem",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
  },
  icon: {
    height: "2.5rem",
    width: "2.5rem",
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(className)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          whiteSpace: "nowrap",
          borderRadius: "0.5rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
