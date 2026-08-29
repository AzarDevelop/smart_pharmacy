import * as React from "react";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children, ...props }: { children?: React.ReactNode; delayDuration?: number; [key: string]: any }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children?: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as any).displayName === "TooltipContent") {
          return visible ? child : null;
        }
        return child;
      })}
    </div>
  );
}

export function TooltipTrigger({ asChild, children, ...props }: { asChild?: boolean; children?: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

export function TooltipContent({
  className,
  children,
  side,
  align,
  hidden,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  side?: string;
  align?: string;
  hidden?: boolean;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 overflow-hidden rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-none whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

TooltipContent.displayName = "TooltipContent";