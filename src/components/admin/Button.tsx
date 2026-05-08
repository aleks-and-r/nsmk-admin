import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "danger" | "ghost" | "raw";
type Size = "md" | "sm" | "xs" | "icon";

const VARIANT_CLS: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent/90 text-white font-semibold",
  danger: "bg-red-500 hover:bg-red-600 text-white font-semibold",
  ghost: "border border-card-border hover:bg-black/5 text-foreground",
  raw: "",
};

const SIZE_CLS: Record<Size, string> = {
  md: "px-6 py-2 text-sm",
  sm: "px-4 py-2 text-sm",
  xs: "px-3 py-1.5 text-xs",
  icon: "p-1.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center rounded transition-colors disabled:opacity-60 ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
    >
      {children}
    </button>
  );
}
