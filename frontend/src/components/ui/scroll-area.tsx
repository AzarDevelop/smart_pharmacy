import * as React from "react";
import { cn } from "../../lib/utils";

export function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: {
  className?: string;
  orientation?: "vertical" | "horizontal";
  [key: string]: any;
}) {
  return null;
}
