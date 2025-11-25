"use client";

import { useTheme } from "@/context/ThemeContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import clsx from "clsx";

export default function PrivacyToggle() {
    const { privacyMode, togglePrivacyMode } = useTheme();

    return (
        <button
            onClick={togglePrivacyMode}
            className={clsx(
                "p-2 rounded-full transition-all duration-300",
                privacyMode
                    ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/25"
                    : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary"
            )}
            title={privacyMode ? "Gizlilik Modunu Kapat" : "Gizlilik Modunu Aç"}
        >
            {privacyMode ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
    );
}
