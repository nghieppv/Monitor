import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
