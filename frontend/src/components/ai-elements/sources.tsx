import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import { BookIcon, ChevronDownIcon } from "lucide-react";

export interface SourcesProps {
  count?: number;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Sources({ className = "", children, ...props }: SourcesProps) {
  return (
    <Collapsible
      className={cn("mb-3 text-xs text-teal-800", className)}
      {...props}
    >
      {children}
    </Collapsible>
  );
}

export interface SourcesTriggerProps {
  count?: number;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function SourcesTrigger({
  count = 0,
  children,
  className = "",
  ...props
}: SourcesTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn("flex items-center gap-1.5 font-medium hover:underline", className)}
      {...props}
    >
      {children ?? (
        <>
          <BookIcon className="w-3.5 h-3.5" />
          <span>Used {count} clinical sources</span>
          <ChevronDownIcon className="w-3 h-3" />
        </>
      )}
    </CollapsibleTrigger>
  );
}

export interface SourcesContentProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function SourcesContent({
  className = "",
  children,
  ...props
}: SourcesContentProps) {
  return (
    <CollapsibleContent
      className={cn("mt-2 flex flex-col gap-1.5 pl-4 border-l border-teal-200", className)}
      {...props}
    >
      {children}
    </CollapsibleContent>
  );
}

export interface SourceProps {
  href?: string;
  title?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Source({
  href,
  title,
  children,
  className = "",
  ...props
}: SourceProps) {
  return (
    <a
      className={cn("flex items-center gap-1.5 text-teal-700 hover:text-teal-950 underline", className)}
      href={href}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children ?? (
        <>
          <BookIcon className="w-3 h-3" />
          <span>{title || href}</span>
        </>
      )}
    </a>
  );
}