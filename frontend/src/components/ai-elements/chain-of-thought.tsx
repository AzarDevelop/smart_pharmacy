import React from "react";
import { Badge } from "../ui/Badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";

export interface ChainOfThoughtProps {
  steps?: { title: string; detail?: string; status?: "completed" | "active" | "pending" }[];
  className?: string;
  defaultOpen?: boolean;
}

export function ChainOfThought({ steps = [], className, defaultOpen = true }: ChainOfThoughtProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn("rounded-xl border border-teal-200 bg-white p-3 shadow-xs my-2 text-xs", className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-teal-900">
        <div className="flex items-center gap-1.5">
          <BrainIcon className="w-4 h-4 text-teal-700" />
          <span>Clinical Decision Chain ({steps.length} steps)</span>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-teal-700" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pt-2 border-t border-slate-100">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2 text-slate-700">
            <Badge variant={step.status === "completed" ? "success" : "secondary"}>
              Step {idx + 1}
            </Badge>
            <div>
              <div className="font-medium text-slate-900">{step.title}</div>
              {step.detail && <div className="text-slate-500 text-[11px] mt-0.5">{step.detail}</div>}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
