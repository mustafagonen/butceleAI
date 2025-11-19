"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { FaWallet, FaMoon, FaSun, FaRocket, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    const toggleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("futuristic");
        else setTheme("light");
    };

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
                            <Link href="/expenses" className="hidden md:block hover:text-accent-primary transition-colors">Harcamalar</Link>
                            <Link href="/incomes" className="hidden md:block hover:text-accent-primary transition-colors">Gelirler</Link>
                            <Link href="/dashboard" className="hidden md:block hover:text-accent-primary transition-colors">Panel</Link>
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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-accent-primary" />
                                ) : (
                                    <FaUser className="text-text-secondary" />
                                )}
                                <span className="hidden sm:block text-sm font-medium">{user.displayName}</span>
                            </div>
                            <button onClick={logout} className="text-red-500 hover:text-red-400" title="Çıkış Yap">
                                <FaSignOutAlt />
                            </button>
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
