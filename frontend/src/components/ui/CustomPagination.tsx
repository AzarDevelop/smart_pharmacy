import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CustomPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  className?: string;
}

export function CustomPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className
}: CustomPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [customCount, setCustomCount] = useState("");
  const viewCountOptions = Array.from(
    new Set([5, 10, 15, 20, totalItems].filter((size) => size > 0)),
  ).sort((a, b) => a - b);

  const applyViewCount = (count: number) => {
    const nextCount = Math.min(totalItems, Math.max(1, Math.floor(count)));
    onItemsPerPageChange(nextCount);
    onPageChange(1);
  };

  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("sticky bottom-0 z-20 mx-auto w-fit pb-6", className)}
    >
      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/85 px-4 py-3 shadow-xl shadow-primary/5 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              View Count
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-[72px] rounded-2xl border-border/70 bg-background/80"
                >
                  {itemsPerPage}
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36 rounded-2xl border-border/70 bg-popover/95 p-2 backdrop-blur">
                {viewCountOptions.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => applyViewCount(size)}
                  >
                    {size === totalItems ? `${size} (Total)` : size}
                  </DropdownMenuItem>
                ))}
                <div className="mt-1 border-t border-border/60 pt-2">
                  <label className="mb-1 block px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Custom
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customCount}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setCustomCount(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        const parsed = Number(customCount);
                        if (Number.isFinite(parsed)) applyViewCount(parsed);
                      }
                    }}
                    placeholder="Count"
                    className="h-8 w-full rounded-xl border border-input bg-background px-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden h-5 w-px bg-border/70 sm:block" />

          <p className="font-medium">
            Total Records : <span className="text-foreground">{totalItems}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 sm:border-l sm:border-border/70 sm:pl-5">
          <motion.div whileHover={{ scale: currentPage === 1 ? 1 : 1.03 }} whileTap={{ scale: currentPage === 1 ? 1 : 0.97 }}>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="h-9 rounded-2xl px-3 font-medium"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ y: -1 }}
            className="flex h-9 items-center gap-1.5 rounded-2xl border border-primary/15 bg-primary/10 px-3 text-sm font-semibold text-primary"
          >
            {currentPage}
            <span className="text-primary/50">/</span>
            {totalPages}
          </motion.div>

          <motion.div whileHover={{ scale: currentPage === totalPages ? 1 : 1.03 }} whileTap={{ scale: currentPage === totalPages ? 1 : 0.97 }}>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="h-9 rounded-2xl px-3 font-medium"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
