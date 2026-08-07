"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface GetStartedButtonProps extends HTMLMotionProps<"button"> {
    fullWidth?: boolean;
}

const GetStartedButton = ({
    fullWidth = false,
    className = "",
    children = "Get Started",
    ...props
}: GetStartedButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={[
                "animate-button-gradient px-4 py-1.5 rounded-md hover:shadow-lg text-xs font-medium text-white transition-shadow duration-500",
                fullWidth ? "w-full" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default GetStartedButton;
