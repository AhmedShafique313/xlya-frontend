import { HTMLAttributes } from "react";

export type LogoSize = "sm" | "md" | "lg";
export type LogoVariant = "dark" | "light";

interface LogoProps extends HTMLAttributes<HTMLHeadingElement> {
    size?: LogoSize;
    /** "dark" (default) = LYA in white, for dark backgrounds. "light" = LYA in black, for light backgrounds. */
    variant?: LogoVariant;
}

const sizeStyles: Record<LogoSize, string> = {
    sm: "text-[26px]",
    md: "text-[44px]",
    lg: "text-[76px]",
};

const Logo = ({ size = "lg", variant = "dark", className = "", ...props }: LogoProps) => {
    return (
        <h1
            className={["fjalla-one-regular leading-none", sizeStyles[size], className]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            <span className="text-[var(--gold-primary)]">X</span>
            <span className={variant === "light" ? "text-black" : "text-white"}>LYA</span>
        </h1>
    );
};

export default Logo;
