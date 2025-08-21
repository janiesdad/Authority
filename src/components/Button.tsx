import React from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

function getVariantClasses(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return (
        "bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)] " +
        "hover:brightness-90 disabled:opacity-50 disabled:pointer-events-none"
      );
    case "secondary":
      return (
        "bg-transparent text-[var(--primary)] border border-[var(--primary)] " +
        "hover:bg-[color:var(--secondary)]/20 disabled:opacity-50 disabled:pointer-events-none"
      );
    case "tertiary":
      return (
        "bg-transparent text-[var(--primary)] border border-transparent " +
        "hover:underline disabled:opacity-50 disabled:pointer-events-none"
      );
  }
}

function getSizeClasses(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "h-8 px-3 text-[13px]";
    case "md":
      return "h-10 px-4 text-[14px]";
    case "lg":
      return "h-12 px-5 text-[15px]";
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", isLoading = false, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium tracking-[-0.01em] " +
      "transition-[filter,background,color,border] duration-150 focus-visible:outline-none focus-visible:ring-2 " +
      "focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] select-none";

    const loader = (
      <svg
        className="animate-spin mr-2 h-4 w-4 text-current"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={`${base} ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? loader : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

