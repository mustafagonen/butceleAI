"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { FaWallet, FaMoon, FaSun, FaRocket, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("futuristic");
        else setTheme("light");
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-accent-primary">
                    <FaWallet />
                    <span className="tracking-tighter">BUTCELE</span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link
                                href="/expenses"
                                className={`hidden md:block hover:text-accent-primary transition-colors ${pathname?.startsWith("/expenses") ? "text-accent-primary" : ""}`}
                            >
                                Harcamalar
                            </Link>
                            <Link
                                href="/incomes"
                                className={`hidden md:block hover:text-accent-primary transition-colors ${pathname?.startsWith("/incomes") ? "text-accent-primary" : ""}`}
                            >
                                Gelirler
                            </Link>
                            <Link
                                href="/summary"
                                className={`hidden md:block hover:text-accent-primary transition-colors ${pathname?.startsWith("/summary") ? "text-accent-primary" : ""}`}
                            >
                                Özet
                            </Link>
                            <Link
                                href="/portfolio"
                                className={`hidden md:block hover:text-accent-primary transition-colors ${pathname?.startsWith("/portfolio") ? "text-accent-primary" : ""}`}
                            >
                                Portföyüm
                            </Link>
                            <Link
                                href="/dashboard"
                                className={`hidden md:block hover:text-accent-primary transition-colors ${pathname === "/dashboard" ? "text-accent-primary" : ""}`}
                            >
                                Panel
                            </Link>
                        </>
                    ) : null}

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-accent-secondary"
                        aria-label="Toggle Theme"
                    >
                        {theme === "light" && <FaSun />}
                        {theme === "dark" && <FaMoon />}
                        {theme === "futuristic" && <FaRocket />}
                    </button>

                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/20">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span>{getInitials(user.displayName || "User")}</span>
                                    )}
                                </div>
                                <span className="hidden sm:block font-medium">{user.displayName}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-gray-100 dark:border-white/5">
                                        <p className="text-xs text-text-secondary">Oturum açıldı</p>
                                        <p className="font-medium truncate">{user.email}</p>
                                    </div>
                                    <div className="p-1">
                                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm flex items-center gap-2 transition-colors">
                                            <FaUser className="text-accent-primary" />
                                            Profil
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <FaSignOutAlt />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:brightness-110 transition-all">
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
