import React from "react";
import { cn } from "../../lib/utils";

interface CollapsibleContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollapsibleContext = React.createContext<CollapsibleContextType>({
  open: true,
  setOpen: () => {}
});

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Collapsible({
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  className = "",
  children,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, open, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div className={cn("collapsible-root", className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({
  className = "",
  children,
  onClick,
  asChild = false,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  asChild?: boolean;
  [key: string]: any;
}) {
  const { open, setOpen } = React.useContext(CollapsibleContext);

  const handleClick = (e: any) => {
    setOpen(!open);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: (e: any) => {
        handleClick(e);
        (children as any).props?.onClick?.(e);
      },
      "aria-expanded": open,
      ...props
    });
  }

  return (
    <button
      type="button"
      className={cn("collapsible-trigger cursor-pointer flex items-center justify-between w-full", className)}
      onClick={handleClick}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(CollapsibleContext);

  if (!open) return null;

  return (
    <div className={cn("collapsible-content", className)} {...props}>
      {children}
    </div>
  );
}
