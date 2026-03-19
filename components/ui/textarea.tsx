import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
