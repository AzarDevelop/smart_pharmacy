import React from "react";
import { cn } from "../../lib/utils";

export interface ShimmerProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function Shimmer({ text, children, className = "", ...props }: ShimmerProps) {
  const content = text || children;

  return (
    <span
      className={cn(
        "inline-block bg-gradient-to-r from-teal-700 via-teal-400 to-teal-700 bg-[length:200%_auto] bg-clip-text text-transparent animate-pulse font-medium",
        className
      )}
      style={{
        backgroundSize: "200% auto",
        animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      }}
      {...props}
    >
      {content}
    </span>
  );
}
