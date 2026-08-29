import React from "react";
import { cn } from "../../lib/utils";
import { MessageResponse } from "./message";

export interface ResponseProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Response({ className = "", children, ...props }: ResponseProps) {
  return (
    <MessageResponse
      className={cn("w-full leading-relaxed", className)}
      {...props}
    >
      {children}
    </MessageResponse>
  );
}