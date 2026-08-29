import * as React from "react";
import { cn } from "../../lib/utils";

export function ButtonGroup({
  className,
  children,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md shadow-xs",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ButtonGroupText({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center px-3 py-1 text-xs font-medium text-slate-500", className)}
      {...props}
    >
      {children}
    </span>
  );
}
