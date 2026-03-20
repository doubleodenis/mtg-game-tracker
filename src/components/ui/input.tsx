import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        style={{
          display: "flex",
          height: "2.75rem",
          width: "100%",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          backgroundColor: "rgba(18, 18, 26, 0.9)",
          color: "#ffffff",
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
