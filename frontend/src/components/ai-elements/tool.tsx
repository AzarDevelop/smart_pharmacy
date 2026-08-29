import React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { MapPin, Phone, Building2, PackageCheck, AlertTriangle } from "lucide-react";

export interface ToolProps {
  title?: string;
  state?: "running" | "completed" | "error";
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Tool({ className = "", children, ...props }: ToolProps) {
  return (
    <div
      className={cn(
        "my-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs text-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ToolHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
  [key: string]: any;
}

export function ToolHeader({
  title,
  icon,
  badge,
  className = ""
}: ToolHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-800", className)}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span>{title}</span>
      </div>
      {badge && <Badge variant="secondary">{badge}</Badge>}
    </div>
  );
}

export interface ToolContentProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function ToolContent({ children, className = "", ...props }: ToolContentProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export interface StockCardProps {
  stock: {
    stock_id: string | number;
    medicine_id?: string | number;
    medicine_name?: string;
    generic_name?: string;
    dosage?: string;
    price?: number | string;
    quantity?: number;
    pharmacy_id?: string | number;
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
    distance_km?: number | string;
  };
  onReserve?: (stock: any) => void;
  isReserving?: boolean;
}

export function ToolCallResultCard({ stock, onReserve, isReserving }: StockCardProps) {
  const isOutOfStock = Number(stock.quantity) <= 0;

  return (
    <div
      className="p-3 my-2 bg-teal-50/50 border border-teal-200 rounded-xl flex flex-wrap items-center justify-between gap-3 transition-all hover:shadow-xs"
      style={{
        background: "var(--color-teal-50, #f0fdfa)",
        borderColor: "var(--color-teal-200, #99f6e4)"
      }}
    >
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-teal-950 text-sm">{stock.medicine_name}</span>
          {stock.dosage && (
            <span className="text-[11px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">
              {stock.dosage}
            </span>
          )}
          {stock.generic_name && (
            <span className="text-xs text-slate-500 italic">({stock.generic_name})</span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          <span className="flex items-center gap-1 font-medium text-teal-900">
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            {stock.pharmacy_name}
          </span>
          {stock.pharmacy_address && (
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3" />
              {stock.pharmacy_address}
            </span>
          )}
          {stock.distance_km !== undefined && (
            <span className="font-semibold text-teal-700 bg-teal-100/80 px-1.5 py-0.2 rounded text-[11px]">
              📍 {Number(stock.distance_km).toFixed(1)} km away
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-4 text-xs font-semibold">
          <span className="text-teal-900">₹{Number(stock.price || 0).toFixed(2)}</span>
          <span className={cn("flex items-center gap-1", isOutOfStock ? "text-red-600" : "text-emerald-700")}>
            {isOutOfStock ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
              </>
            ) : (
              <>
                <PackageCheck className="w-3.5 h-3.5" /> {stock.quantity} in stock
              </>
            )}
          </span>
          {stock.pharmacy_phone && (
            <span className="flex items-center gap-1 font-normal text-slate-500">
              <Phone className="w-3 h-3" /> {stock.pharmacy_phone}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Button
          size="sm"
          disabled={isOutOfStock || isReserving}
          onClick={() => onReserve?.(stock)}
          className={cn(
            "text-xs font-bold px-3 py-1.5",
            isOutOfStock ? "opacity-50" : "bg-teal-700 hover:bg-teal-800 text-white"
          )}
        >
          {isReserving ? "Reserving…" : isOutOfStock ? "Unavailable" : "Reserve 1 Unit ⚡"}
        </Button>
      </div>
    </div>
  );
}