import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const itemVariants = cva(
  "group relative flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-transparent",
      },
      size: {
        default: "p-2",
        sm: "p-1.5",
        xs: "p-1",
        lg: "p-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof itemVariants> {
  asChild?: boolean
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(itemVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Item.displayName = "Item"

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex shrink-0 items-center justify-center", className)}
    {...props}
  />
))
ItemMedia.displayName = "ItemMedia"

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col justify-center min-w-0", className)}
    {...props}
  />
))
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium leading-none truncate", className)}
    {...props}
  />
))
ItemTitle.displayName = "ItemTitle"

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground truncate", className)}
    {...props}
  />
))
ItemDescription.displayName = "ItemDescription"

export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription }
