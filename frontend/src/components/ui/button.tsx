import * as React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | string;
export type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | string;

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  [key: string]: any;
}

export const buttonVariants = ({
  variant = "default",
  size = "default",
  className = ""
}: {
  variant?: any;
  size?: any;
  className?: string;
} = {}) => {
  const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none cursor-pointer";
  
  const variantStyles: Record<string, string> = {
    default: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-teal-700 underline-offset-4 hover:underline"
  };

  const sizeStyles: Record<string, string> = {
    default: "h-9 px-4 py-2",
    xs: "h-6 px-2 text-xs rounded",
    sm: "h-8 px-3 text-xs rounded-md",
    lg: "h-10 px-6 text-base rounded-md",
    icon: "h-9 w-9 p-0",
    "icon-xs": "h-6 w-6 p-0 text-xs",
    "icon-sm": "h-8 w-8 p-0 text-sm",
    "icon-lg": "h-10 w-10 p-0"
  };

  return cn(base, variantStyles[variant] || variantStyles.default, sizeStyles[size] || sizeStyles.default, className);
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";