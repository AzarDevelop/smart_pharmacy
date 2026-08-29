import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface InputWrapperProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

export function InputWrapper({
  label,
  error,
  className,
  id,
  ...props
}: InputWrapperProps) {
  const inputId = id || React.useId();
  return (
    <div className={cn("grid w-full items-center gap-1.5", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input id={inputId} {...props} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
