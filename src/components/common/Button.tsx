"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}

const baseClasses =
    "inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "animate-button-gradient text-black rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 hover:scale-[1.02]",
    outline:
        "bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 text-white rounded-lg hover:bg-[#2a2a2a]",
    ghost:
        "text-gray-400 hover:text-[var(--gold-primary)] transition-colors",
};

const sizeClasses: Record<ButtonVariant, Record<ButtonSize, string>> = {
    primary: {
        sm: "py-2 px-4 text-xs",
        md: "py-2.5 px-6 text-[0.78rem]",
        lg: "py-3 px-8 text-sm",
    },
    outline: {
        sm: "py-2 px-4 text-xs",
        md: "py-2.5 px-6 text-sm",
        lg: "py-3 px-8 text-sm",
    },
    ghost: {
        sm: "text-xs",
        md: "text-[0.78rem]",
        lg: "text-sm",
    },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            fullWidth = false,
            className = "",
            children,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={[
                    baseClasses,
                    variantClasses[variant],
                    sizeClasses[variant][size],
                    fullWidth ? "w-full" : "",
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
