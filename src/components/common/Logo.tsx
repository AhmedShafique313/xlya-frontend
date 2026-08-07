import { HTMLAttributes } from "react";

export type LogoSize = "sm" | "md" | "lg";

interface LogoProps extends HTMLAttributes<HTMLHeadingElement> {
    size?: LogoSize;
}

const sizeStyles: Record<LogoSize, string> = {
    sm: "text-[26px]",
    md: "text-[44px]",
    lg: "text-[76px]",
};

const Logo = ({ size = "lg", className = "", ...props }: LogoProps) => {
    return (
        <h1
            className={["fjalla-one-regular leading-none", sizeStyles[size], className]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            <span className="text-[var(--gold-primary)]">X</span>
            <span className="text-white">LYA</span>
        </h1>
    );
};

export default Logo;
