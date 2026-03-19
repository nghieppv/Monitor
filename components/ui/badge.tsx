import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]", {
  variants: {
    variant: {
      neutral: "bg-secondary text-secondary-foreground",
      success: "bg-emerald-500/15 text-emerald-700",
      warning: "bg-amber-500/15 text-amber-700",
      destructive: "bg-rose-500/15 text-rose-700",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
