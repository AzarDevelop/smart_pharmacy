import React, { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import { BrainIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { Shimmer } from "./shimmer";

export interface ReasoningProps {
  isStreaming?: boolean;
  duration?: number;
  title?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Reasoning({
  isStreaming = false,
  duration,
  title,
  defaultOpen = false,
  children,
  className
}: ReasoningProps) {
  const [open, setOpen] = useState(defaultOpen || isStreaming);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      setOpen(true);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const displayTime = duration !== undefined ? duration : elapsed;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-xl border border-teal-100 bg-teal-50/40 my-2 overflow-hidden text-xs transition-all",
        className
      )}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-teal-800 hover:bg-teal-100/50 font-medium">
        <div className="flex items-center gap-2">
          <BrainIcon className={cn("w-4 h-4 text-teal-600", isStreaming && "animate-pulse")} />
          <span>
            {title || (isStreaming ? "Thinking & Analyzing Clinical Data…" : "Clinical Reasoning & Analysis")}
          </span>
          {displayTime > 0 && (
            <span className="text-[10px] text-teal-600/70 font-mono bg-teal-100/60 px-1.5 py-0.5 rounded-full">
              {displayTime}s
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={cn("w-3.5 h-3.5 text-teal-600 transition-transform duration-200", open && "rotate-180")}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 py-2.5 border-t border-teal-100/60 bg-white/70 text-slate-700 font-mono leading-relaxed space-y-1.5">
        {isStreaming && !children ? (
          <div className="flex items-center gap-2 text-teal-700 py-1">
            <SparklesIcon className="w-3.5 h-3.5 animate-spin" />
            <Shimmer text="Evaluating prescription safety, dosage interactions, and nearby stock…" />
          </div>
        ) : (
          children
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ReasoningTrigger(props: React.HTMLAttributes<HTMLButtonElement>) {
  return <CollapsibleTrigger {...props} />;
}

export function ReasoningContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <CollapsibleContent {...props} />;
}
