import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-sans text-base font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        gold: "bg-gold text-bg hover:bg-gold/90",
        glow: "glow-action border border-gold bg-surface text-fg hover:bg-bg-raise",
        quiet: "border border-line bg-transparent text-fg hover:border-gold-dim",
      },
    },
    defaultVariants: { variant: "gold" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { ref?: Ref<HTMLButtonElement> };

export function Button({ className, variant, type = "button", ref, ...props }: Props) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export const fieldClass =
  "min-h-12 w-full rounded-2xl border border-line bg-bg-raise px-4 font-sans text-base text-fg outline-none placeholder:text-muted focus-visible:border-gold";
