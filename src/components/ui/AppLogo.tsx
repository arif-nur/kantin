import React from "react";

interface AppLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textColor?: string;
}

export default function AppLogo({
  className = "w-9 h-9",
  size,
  withText = false,
  textColor = "text-gray-900",
}: AppLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`flex items-center gap-2.5 ${withText ? "select-none" : ""}`}>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} flex-shrink-0 drop-shadow-sm`}
        style={style}
      >
        <defs>
          <linearGradient id="appLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Rounded Squircle Background */}
        <rect width="512" height="512" rx="112" fill="url(#appLogoGrad)" />

        {/* Minimalist Bowl */}
        <g fill="#FFFFFF">
          <rect x="126" y="246" width="260" height="22" rx="11" />
          <path d="M142 278 C146 362 208 396 256 396 C304 396 366 362 370 278 H142 Z" />
        </g>

        {/* Steam Lines */}
        <g stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" fill="none">
          <path d="M212 212 C200 185 205 165 216 145 C224 130 220 115 212 105" />
          <path d="M256 202 C244 175 250 155 262 135 C270 120 266 105 256 95" />
          <path d="M300 212 C288 185 294 165 306 145 C314 130 310 115 302 105" />
        </g>
      </svg>

      {withText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-base leading-tight ${textColor}`}>
            Kantin<span className="text-brand-600">Kampus</span>
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Campus Smart Canteen
          </span>
        </div>
      )}
    </div>
  );
}
