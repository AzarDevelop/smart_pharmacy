import React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown, Sparkles } from "lucide-react";

export function ModelSelector({
  open,
  onOpenChange,
  children,
  className = "",
  ...props
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div className={cn("relative inline-block text-left", className)} {...props}>
      {children}
    </div>
  );
}

export function ModelSelectorTrigger({
  asChild,
  children,
  className = "",
  onClick,
  ...props
}: {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: any) => void;
  [key: string]: any;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 cursor-pointer", className)} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function ModelSelectorLogo({
  provider,
  className = "",
}: {
  provider?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold bg-teal-100 text-teal-800", className)}>
      <Sparkles className="w-3 h-3 text-teal-700" />
    </span>
  );
}

export function ModelSelectorLogoGroup({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-1", className)}>{children}</div>;
}

export function ModelSelectorName({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn("text-xs font-semibold text-slate-800", className)}>{children}</span>;
}

export function ModelSelectorContent({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute bottom-full mb-2 left-0 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModelSelectorInput({
  placeholder = "Search models...",
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={cn("w-full px-2.5 py-1.5 mb-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-teal-500", className)}
      {...props}
    />
  );
}

export function ModelSelectorList({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("max-h-60 overflow-y-auto space-y-2", className)}>{children}</div>;
}

export function ModelSelectorEmpty({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("text-center py-4 text-xs text-slate-400", className)}>{children}</div>;
}

export function ModelSelectorGroup({ heading, children, className = "" }: { heading?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {heading && <div className="px-2 text-[10px] font-bold uppercase text-slate-400">{heading}</div>}
      {children}
    </div>
  );
}

export function ModelSelectorItem({
  value,
  onSelect,
  children,
  className = "",
  ...props
}: {
  value?: string;
  onSelect?: (val: string) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value || "")}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
