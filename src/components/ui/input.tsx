import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { variant?: 'default' | 'glass' }>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const baseClass = variant === 'glass'
      ? "glass-input flex h-10 w-full rounded-md text-base placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      : "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    return (
      <input
        type={type}
        className={cn(baseClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
