import * as React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline" | "ghost" | "link" | string;

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const badgeVariants = ({
  variant = "default",
  className = ""
}: {
  variant?: any;
  className?: string;
} = {}) => {
  const base = "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors";
  
  const variantStyles: Record<string, string> = {
    default: "border-transparent bg-teal-700 text-white shadow-xs",
    secondary: "border-transparent bg-slate-100 text-slate-800",
    destructive: "border-transparent bg-red-500 text-white shadow-xs",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    outline: "border-slate-200 text-slate-700 bg-white",
    ghost: "border-transparent text-slate-700 hover:bg-slate-100",
    link: "border-transparent text-teal-700 underline-offset-4 hover:underline"
  };

  return cn(base, variantStyles[variant] || variantStyles.default, className);
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={badgeVariants({ variant, className })}
      {...props}
    />
  );
}
