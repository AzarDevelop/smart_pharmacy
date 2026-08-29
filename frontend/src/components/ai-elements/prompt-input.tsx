import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { SendIcon, SquareIcon, Paperclip, Plus } from "lucide-react";

export interface PromptInputMessage {
  text?: string;
  files?: Array<{ id: string; name: string; type: string; url: string }>;
}

interface PromptInputContextType {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (message: PromptInputMessage | any) => void;
  disabled?: boolean;
  files?: any[];
  addFile?: (file: any) => void;
  removeFile?: (id: string) => void;
}

const PromptInputContext = createContext<PromptInputContextType>({});

export function usePromptInputAttachments() {
  const ctx = useContext(PromptInputContext);
  const [files, setFiles] = useState<any[]>([]);

  return {
    files: ctx.files || files,
    add: ctx.addFile || ((f: any) => setFiles((prev) => [...prev, f])),
    remove: ctx.removeFile || ((id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))),
    clear: () => setFiles([])
  };
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  globalDrop,
  multiple,
  className = "",
  children,
  ...props
}: any) {
  const [files, setFiles] = useState<any[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ text: value, files });
    }
  };

  const addFile = (file: any) => setFiles((prev) => [...prev, file]);
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <PromptInputContext.Provider value={{ value, onChange, onSubmit, disabled, files, addFile, removeFile }}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all",
          className
        )}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export function PromptInputHeader({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  if (!children) return null;
  return <div className={cn("px-3 pt-2", className)} {...props}>{children}</div>;
}

export function PromptInputBody({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3 py-1.5 flex-1", className)} {...props}>{children}</div>;
}

export function PromptInputTextarea({
  className = "",
  onKeyDown,
  value,
  onChange,
  ...props
}: any) {
  const ctx = useContext(PromptInputContext);
  const val = value !== undefined ? value : ctx.value;
  const handleChange = onChange || ctx.onChange;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ctx.onSubmit?.({ text: val, files: ctx.files });
    }
    onKeyDown?.(e);
  };

  return (
    <textarea
      value={val}
      onChange={handleChange}
      disabled={ctx.disabled}
      onKeyDown={handleKeyDown}
      rows={2}
      className={cn(
        "w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-0 max-h-36 leading-relaxed border-none p-0",
        className
      )}
      placeholder="Ask about medications, dosage, contraindications, or availability…"
      {...props}
    />
  );
}

export function PromptInputFooter({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-3 py-2 flex items-center justify-between gap-2 border-t border-slate-100/80 bg-slate-50/50", className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputTools({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputButton({
  children,
  variant = "ghost",
  className = "",
  onClick,
  ...props
}: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
        variant === "default"
          ? "bg-teal-700 text-white hover:bg-teal-800"
          : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 bg-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PromptInputActionMenu({ children, className = "", ...props }: any) {
  return <div className={cn("relative inline-block", className)} {...props}>{children}</div>;
}

export function PromptInputActionMenuTrigger({ children, className = "", ...props }: any) {
  return (
    <button
      type="button"
      className={cn("p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer", className)}
      {...props}
    >
      {children || <Plus className="w-4 h-4" />}
    </button>
  );
}

export function PromptInputActionMenuContent({ children, className = "", ...props }: any) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputActionAddAttachments({ className = "", ...props }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { add } = usePromptInputAttachments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((f) => {
        add({
          id: Math.random().toString(),
          name: f.name,
          type: f.type,
          url: URL.createObjectURL(f)
        });
      });
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        multiple
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={cn("p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer", className)}
        title="Attach files"
        {...props}
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </>
  );
}

export function PromptInputSubmit({
  isStreaming = false,
  status,
  disabled = false,
  onStop,
  className = "",
  ...props
}: any) {
  const isBusy = status === "streaming" || isStreaming;

  if (isBusy) {
    return (
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={onStop}
        className={cn("gap-1.5 rounded-full px-3 text-xs font-semibold h-8", className)}
        {...props}
      >
        <SquareIcon className="w-3.5 h-3.5 fill-current" />
        <span>Stop</span>
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      size="sm"
      disabled={disabled}
      className={cn(
        "gap-1.5 rounded-full px-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs h-8 disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span>Send</span>
      <SendIcon className="w-3.5 h-3.5" />
    </Button>
  );
}