import React from "react";

interface VistaLogoProps {
    className?: string;
    height?: number;
    color?: string;
}

export default function VistaLogo({ className = "h-7 w-auto", color = "currentColor" }: VistaLogoProps) {
    return (
        <svg
            viewBox="0 0 280 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Circuit Trace Path */}
            <path
                d="M 18 45 L 82 45 Q 92 45 92 35 L 92 18 L 225 18"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Node Dots */}
            <circle cx="18" cy="45" r="7" stroke={color} strokeWidth="4" fill="#0c0516" />
            <circle cx="225" cy="18" r="7" stroke={color} strokeWidth="4" fill="#0c0516" />

            {/* Letter V */}
            <path
                d="M 28 20 L 40 48 L 52 20 H 45 L 40 37 L 35 20 Z"
                fill={color}
            />

            {/* Letter I */}
            <path
                d="M 62 20 H 70 V 48 H 62 Z"
                fill={color}
            />

            {/* Letter S */}
            <path
                d="M 102 24 C 102 21 112 21 118 24 C 122 26 122 30 116 32 L 106 35 C 98 37 98 44 104 47 C 112 50 124 49 126 44 L 120 40 C 117 43 109 43 106 41 C 103 39 104 36 109 35 L 119 32 C 128 29 127 21 119 18 C 109 15 97 19 96 24 Z"
                fill={color}
            />

            {/* Letter T */}
            <path
                d="M 132 20 H 160 V 26 H 150 V 48 H 142 V 26 H 132 Z"
                fill={color}
            />

            {/* Letter A */}
            <path
                d="M 166 48 L 180 20 H 188 L 202 48 H 193 L 189 40 H 179 L 175 48 Z M 181 34 H 187 L 184 27 Z"
                fill={color}
            />
        </svg>
    );
}
