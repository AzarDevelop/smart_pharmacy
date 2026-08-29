import * as React from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function Tree({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="tree" className={cn("select-none text-sm", className)} {...props} />;
}

export type TreeNodeProps = {
  nodeId: string;
  label: React.ReactNode;
  leading?: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  /** Fires when the primary label / row (not the expand chevron) is activated */
  onRowClick?: () => void;
  actions?: React.ReactNode;
  depth?: number;
};

/**
 * One row in a tree: leaf (no children) or branch (collapsible).
 * Uses Radix Collapsible for expand/collapse; follows a lightweight tree ARIA pattern.
 */
export function TreeNode({
  nodeId,
  label,
  leading,
  defaultOpen = false,
  children,
  onRowClick,
  actions,
  depth = 0,
}: TreeNodeProps) {
  const hasBranch = Boolean(children);
  const [open, setOpen] = useState(defaultOpen);
  const pad = 10 + depth * 14;

  if (!hasBranch) {
    return (
      <div
        role="treeitem"
        data-tree-node-id={nodeId}
        className="group flex min-h-8 items-center gap-1 rounded-md py-0.5 pr-2 hover:bg-muted/60"
        style={{ paddingLeft: pad }}
      >
        <span className="w-5 shrink-0" aria-hidden />
        {leading}
        <button
          type="button"
          className="min-w-0 flex-1 truncate rounded px-0.5 text-left font-medium text-foreground hover:underline"
          onClick={onRowClick}
        >
          {label}
        </button>
        {actions}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        role="treeitem"
        data-tree-node-id={nodeId}
        className="flex flex-col rounded-md"
        aria-expanded={open}
      >
        <div
          className="group flex min-h-8 items-center gap-1 py-0.5 pr-2 hover:bg-muted/60"
          style={{ paddingLeft: pad }}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={open ? "Collapse" : "Expand"}
              onClick={e => e.stopPropagation()}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
          {leading}
          <button
            type="button"
            className="min-w-0 flex-1 truncate rounded px-0.5 text-left font-medium text-foreground hover:underline"
            onClick={onRowClick}
          >
            {label}
          </button>
          {actions}
        </div>
        <CollapsibleContent>
          <div role="group" className="pl-0.5">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
