import React from "react";
import { cn } from "../../lib/utils";
import { Sparkles } from "lucide-react";

export interface SuggestionsProps {
  wrap?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Suggestions({ className = "", children, wrap = false, ...props }: SuggestionsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 w-full p-2.5 bg-slate-50/80 border-t border-slate-200 overflow-x-auto no-scrollbar",
        wrap ? "flex-wrap" : "flex-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SuggestionProps {
  suggestion?: string;
  onClick?: (suggestion: any) => void;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Suggestion({
  suggestion,
  onClick,
  className = "",
  children,
  icon,
  ...props
}: SuggestionProps) {
  const handleClick = () => {
    onClick?.(suggestion || children);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs hover:border-teal-500 hover:text-teal-800 hover:bg-teal-50/50 transition-all cursor-pointer shrink-0 whitespace-nowrap",
        className
      )}
      {...props}
    >
      {icon || <Sparkles className="w-3 h-3 text-teal-600" />}
      <span>{children || suggestion}</span>
    </button>
  );
}