import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-border rounded-xl shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px]",
        accent:
          "bg-accent text-accent-foreground border-2 border-border rounded-xl shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px]",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-border rounded-xl shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        outline:
          "border-2 border-border bg-background rounded-xl shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px]",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border rounded-xl shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        ghost:
          "hover:bg-secondary rounded-xl font-semibold",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
