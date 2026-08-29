import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code?: string;
  language?: string;
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CodeBlock({
  code = "",
  language = "text",
  filename,
  className = "",
  children,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const textContent = code || (typeof children === "string" ? children : "");

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden my-3 shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span>{filename || language}</span>
        <Button
          size="xs"
          variant="ghost"
          onClick={handleCopy}
          className="text-slate-400 hover:text-white h-6 px-1.5"
        >
          {copied ? <CheckIcon className="w-3 h-3 text-emerald-400 mr-1" /> : <CopyIcon className="w-3 h-3 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed">
        <code>{textContent || children}</code>
      </pre>
    </div>
  );
}