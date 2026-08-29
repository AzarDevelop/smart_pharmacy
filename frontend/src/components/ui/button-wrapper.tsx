import * as React from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";

export interface ButtonWrapperProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export function ButtonWrapper({
  loading,
  disabled,
  children,
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonWrapperProps) {
  return (
    <Button 
      disabled={loading || disabled} 
      variant={variant} 
      size={size} 
      className={className}
      asChild={asChild}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
