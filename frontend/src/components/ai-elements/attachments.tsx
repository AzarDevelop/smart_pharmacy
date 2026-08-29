import React from "react";
import { cn } from "../../lib/utils";
import { X, FileText, Paperclip } from "lucide-react";

export interface AttachmentData {
  id: string;
  name: string;
  type?: string;
  url?: string;
  size?: number;
}

export function Attachments({
  variant = "inline",
  children,
  className = "",
  ...props
}: {
  variant?: "inline" | "block";
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-2",
        variant === "inline" ? "flex-row" : "flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Attachment({
  data,
  onRemove,
  children,
  className = "",
  ...props
}: {
  data: AttachmentData;
  onRemove?: () => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium transition-all",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <Paperclip className="w-3.5 h-3.5 text-teal-700" />
          <span className="max-w-[120px] truncate">{data.name}</span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="hover:text-red-600 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function AttachmentPreview({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <FileText className="w-3.5 h-3.5 text-teal-600" />
    </div>
  );
}

export function AttachmentRemove({
  onClick,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors", className)}
      {...props}
    >
      <X className="w-3 h-3" />
    </button>
  );
}
