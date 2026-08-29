import { Loader2 } from "lucide-react";

export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`animate-spin text-indigo-600 ${className}`} />
    </div>
  );
}
