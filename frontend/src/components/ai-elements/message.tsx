import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { CheckIcon, CopyIcon } from "lucide-react";

export interface MessageProps {
  from?: "user" | "assistant" | "system";
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Message({ className = "", from = "assistant", children, ...props }: MessageProps) {
  const isUser = from === "user";
  return (
    <div
      className={cn(
        "group flex w-full gap-3 transition-all",
        isUser ? "justify-end is-user" : "justify-start is-assistant",
        className
      )}
      {...props}
    >
      {!isUser && <MessageAvatar from="assistant" fallback="AI" />}
      <div
        className={cn(
          "flex flex-col gap-1.5 max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {children}
      </div>
      {isUser && <MessageAvatar from="user" fallback="U" />}
    </div>
  );
}

export interface MessageAvatarProps {
  from?: "user" | "assistant" | "system";
  fallback?: string;
  src?: string;
  className?: string;
}

export function MessageAvatar({ from = "assistant", fallback = "AI", src, className = "" }: MessageAvatarProps) {
  const isUser = from === "user";
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm",
        isUser ? "bg-slate-800 text-white" : "bg-teal-700 text-white",
        className
      )}
      style={{
        background: isUser ? "var(--color-teal-900, #0b3b36)" : "var(--color-teal-700, #0f5f56)",
        color: "#ffffff"
      }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full rounded-full object-cover" />
      ) : isUser ? (
        "👤"
      ) : (
        "💊"
      )}
    </div>
  );
}

export interface MessageContentProps {
  from?: "user" | "assistant" | "system";
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MessageContent({ children, className = "", from = "assistant", ...props }: MessageContentProps) {
  const isUser = from === "user";
  return (
    <div
      className={cn(
        "w-fit min-w-0 max-w-full text-sm leading-relaxed",
        isUser
          ? "rounded-2xl rounded-tr-xs bg-teal-700 text-white px-4 py-3 shadow-md"
          : "rounded-2xl rounded-tl-xs bg-white text-slate-800 border border-slate-200 px-4 py-3.5 shadow-xs",
        className
      )}
      style={
        isUser
          ? { background: "var(--color-teal-700, #0f5f56)", color: "#FFFFFF" }
          : { background: "var(--color-surface, #FFFFFF)", color: "var(--color-text, #1E293B)", border: "1px solid var(--color-border, #E2E8F0)" }
      }
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageResponseProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MessageResponse({
  children,
  className = "",
  ...props
}: MessageResponseProps) {
  if (!children) return null;
  if (typeof children !== "string") {
    return <div className={cn("text-sm leading-relaxed space-y-2 markdown-content", className)} {...props}>{children}</div>;
  }

  const processedText = children.replace(/\+\+([^+]+)\+\+/g, '### $1');

  return (
    <div className={cn("text-sm leading-relaxed markdown-content", className)} {...props}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...rest }) => (
            <div className="overflow-x-auto my-3 w-full">
              <table className="ai-markdown-table min-w-full text-xs" {...rest} />
            </div>
          ),
          th: ({ node, ...rest }) => <th className="px-3 py-2 bg-teal-50 text-teal-950 font-semibold border border-teal-200 text-left" {...rest} />,
          td: ({ node, ...rest }) => <td className="px-3 py-2 border border-slate-200 text-slate-700" {...rest} />,
          code: ({ node, inline, ...rest }: any) =>
            inline ? (
              <code className="bg-slate-100 text-teal-900 px-1.5 py-0.5 rounded text-xs font-mono" {...rest} />
            ) : (
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-2 font-mono"><code {...rest} /></pre>
            ),
          h1: ({ node, ...rest }) => <h3 className="font-bold text-teal-950 text-base mt-3 mb-1.5" {...rest} />,
          h2: ({ node, ...rest }) => <h4 className="font-bold text-teal-900 text-sm mt-2.5 mb-1" {...rest} />,
          h3: ({ node, ...rest }) => <h5 className="font-bold text-teal-900 text-xs mt-2 mb-1" {...rest} />,
          ul: ({ node, ...rest }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5" {...rest} />,
          ol: ({ node, ...rest }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5" {...rest} />,
          li: ({ node, ...rest }) => <li className="my-0.5 text-xs sm:text-sm" {...rest} />,
          p: ({ node, ...rest }) => <p className="my-1.5 text-xs sm:text-sm leading-relaxed" {...rest} />
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
}

export interface MessageToolbarProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MessageToolbar({ className = "", children, ...props }: MessageToolbarProps) {
  return (
    <div className={cn("flex items-center gap-1 mt-1 text-xs text-slate-500", className)} {...props}>
      {children}
    </div>
  );
}

export interface MessageActionsProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MessageActions({ className = "", children, ...props }: MessageActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export interface MessageActionProps {
  tooltip?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  [key: string]: any;
}

export function MessageAction({
  tooltip,
  children,
  label,
  className = "",
  ...props
}: MessageActionProps) {
  const btn = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-200",
        className
      )}
      {...props}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return btn;
}

export function MessageCopy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MessageAction onClick={handleCopy} tooltip="Copy message">
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied!" : label}</span>
    </MessageAction>
  );
}

// Branch context
const BranchContext = React.createContext<{
  currentBranch: number;
  totalBranches: number;
  setBranch: (b: number) => void;
  next: () => void;
  prev: () => void;
}>({
  currentBranch: 0,
  totalBranches: 1,
  setBranch: () => {},
  next: () => {},
  prev: () => {},
});

export function MessageBranch({
  defaultBranch = 0,
  children,
  className = "",
  ...props
}: {
  defaultBranch?: number;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const [currentBranch, setBranch] = useState(defaultBranch);
  const [totalBranches, setTotalBranches] = useState(1);

  const next = () => setBranch((b) => Math.min(totalBranches - 1, b + 1));
  const prev = () => setBranch((b) => Math.max(0, b - 1));

  return (
    <BranchContext.Provider value={{ currentBranch, totalBranches, setBranch, next, prev }}>
      <div className={cn("w-full space-y-2", className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === MessageBranchContent) {
            return React.cloneElement(child as any, { onTotalBranches: setTotalBranches });
          }
          return child;
        })}
      </div>
    </BranchContext.Provider>
  );
}

export function MessageBranchContent({
  children,
  onTotalBranches,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  onTotalBranches?: (total: number) => void;
  className?: string;
  [key: string]: any;
}) {
  const { currentBranch } = React.useContext(BranchContext);
  const childrenArray = React.Children.toArray(children);

  React.useEffect(() => {
    onTotalBranches?.(childrenArray.length);
  }, [childrenArray.length, onTotalBranches]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {childrenArray[currentBranch] || childrenArray[0]}
    </div>
  );
}

export function MessageBranchSelector({
  children,
  className = "",
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { totalBranches } = React.useContext(BranchContext);
  if (totalBranches <= 1) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 bg-slate-100/80 rounded-full border border-slate-200",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </>
      )}
    </div>
  );
}

export function MessageBranchPrevious({ className = "", ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { currentBranch, prev } = React.useContext(BranchContext);
  return (
    <button
      type="button"
      disabled={currentBranch === 0}
      onClick={prev}
      className={cn("p-0.5 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-default", className)}
      {...props}
    >
      ◀
    </button>
  );
}

export function MessageBranchNext({ className = "", ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { currentBranch, totalBranches, next } = React.useContext(BranchContext);
  return (
    <button
      type="button"
      disabled={currentBranch >= totalBranches - 1}
      onClick={next}
      className={cn("p-0.5 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-default", className)}
      {...props}
    >
      ▶
    </button>
  );
}

export function MessageBranchPage({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  const { currentBranch, totalBranches } = React.useContext(BranchContext);
  return (
    <span className={cn("font-medium text-[11px] select-none", className)} {...props}>
      {currentBranch + 1} of {totalBranches}
    </span>
  );
}

