import { useMemo, useState, useEffect } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckSquare, Square, MinusSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";
import { cn } from "@/lib/utils";

type SortableValue = string | number | boolean | Date | null | undefined;

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T, index: number) => React.ReactNode);
  sortValue?: keyof T | ((item: T) => SortableValue);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  striped?: boolean;
  hoverable?: boolean;
}

type SortDirection = "asc" | "desc";

function normalizeSortValue(value: SortableValue) {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  onRowClick,
  selectable = false,
  selectedRows: externalSelectedRows,
  onSelectionChange,
  className,
  rowClassName,
  striped = false,
  hoverable = true,
}: DataTableProps<T>) {
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());

  const selectedRows = externalSelectedRows || internalSelectedRows;

  const sortedData = useMemo(() => {
    if (sortColumnIndex === null) return data;

    const column = columns[sortColumnIndex];
    if (!column?.sortable) return data;

    const resolveValue = (item: T) => {
      if (typeof column.sortValue === "function") {
        return normalizeSortValue(column.sortValue(item));
      }
      if (typeof column.sortValue === "string") {
        return normalizeSortValue(item[column.sortValue] as SortableValue);
      }
      if (typeof column.accessor === "string") {
        return normalizeSortValue(item[column.accessor] as SortableValue);
      }
      return null;
    };

    return [...data].sort((a, b) => {
      const aValue = resolveValue(a);
      const bValue = resolveValue(b);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [columns, data, sortColumnIndex, sortDirection]);

  const handleSort = (columnIndex: number, column: Column<T>) => {
    if (!column.sortable) return;

    if (sortColumnIndex === columnIndex) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumnIndex(columnIndex);
    setSortDirection("asc");
  };

  const toggleAll = () => {
    const newSelected = new Set<string | number>();
    if (selectedRows.size < data.length) {
      data.forEach(item => newSelected.add(item[keyField] as any));
    }
    
    if (!externalSelectedRows) setInternalSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  const toggleRow = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    
    if (!externalSelectedRows) setInternalSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={cn("rounded-md border border-border overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/50">
            {selectable && (
              <TableHead className="w-10 px-4">
                <button 
                  onClick={toggleAll}
                  className="flex items-center justify-center transition-colors hover:text-primary"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : isSomeSelected ? (
                    <MinusSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </button>
              </TableHead>
            )}
            {columns.map((column, i) => {
              const isSorted = sortColumnIndex === i;

              return (
                <TableHead
                  key={i}
                  onClick={() => handleSort(i, column)}
                  className={cn(column.className, column.sortable && "cursor-pointer select-none")}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                      {column.header}
                    </span>
                    {column.sortable &&
                      (isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                      ))}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((item, rowIdx) => {
              const id = item[keyField] as string | number;
              const isSelected = selectedRows.has(id);
              
              return (
                <TableRow
                  key={id ? String(id) : `row-${rowIdx}`}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/[0.04]",
                    hoverable && "hover:bg-primary/[0.02]",
                    striped && rowIdx % 2 !== 0 && "bg-muted/5",
                    typeof rowClassName === "function" ? rowClassName(item) : rowClassName
                  )}
                >
                  {selectable && (
                    <TableCell className="w-10 px-4">
                      <button 
                        onClick={(e) => toggleRow(id, e)}
                        className="flex items-center justify-center transition-colors hover:text-primary"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/20" />
                        )}
                      </button>
                    </TableCell>
                  )}
                  {columns.map((column, j) => (
                    <TableCell key={j} className={cn("text-xs", column.className)}>
                      {typeof column.accessor === "function"
                        ? column.accessor(item, rowIdx)
                        : (item[column.accessor] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground/50 italic text-sm">
                   No results.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
