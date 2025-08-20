import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
function getVariantClasses(variant) {
    switch (variant) {
        case "primary":
            return ("bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)] " +
                "hover:brightness-90 disabled:opacity-50 disabled:pointer-events-none");
        case "secondary":
            return ("bg-transparent text-[var(--primary)] border border-[var(--primary)] " +
                "hover:bg-[color:var(--secondary)]/20 disabled:opacity-50 disabled:pointer-events-none");
        case "tertiary":
            return ("bg-transparent text-[var(--primary)] border border-transparent " +
                "hover:underline disabled:opacity-50 disabled:pointer-events-none");
    }
}
function getSizeClasses(size) {
    switch (size) {
        case "sm":
            return "h-8 px-3 text-[13px]";
        case "md":
            return "h-10 px-4 text-[14px]";
        case "lg":
            return "h-12 px-5 text-[15px]";
    }
}
export const Button = React.forwardRef(({ variant = "primary", size = "md", className = "", isLoading = false, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium tracking-[-0.01em] " +
        "transition-[filter,background,color,border] duration-150 focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] select-none";
    const loader = (_jsxs("svg", { className: "animate-spin mr-2 h-4 w-4 text-current", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }));
    return (_jsxs("button", { ref: ref, className: `${base} ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`, disabled: disabled || isLoading, ...props, children: [isLoading ? loader : null, children] }));
});
Button.displayName = "Button";
export default Button;
