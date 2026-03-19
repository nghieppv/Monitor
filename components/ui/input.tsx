import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
