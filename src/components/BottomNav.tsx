"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaWallet, FaChartPie, FaHome, FaList, FaChartLine } from "react-icons/fa";
import { useLanguage } from "@/context/LanguageContext";
import clsx from "clsx";

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { href: "/dashboard", label: t("bottomNav.panel"), icon: FaHome },
        { href: "/incomes", label: t("bottomNav.income"), icon: FaWallet },
        { href: "/expenses", label: t("bottomNav.expense"), icon: FaList },
        { href: "/portfolio", label: t("bottomNav.portfolio"), icon: FaChartLine },
        { href: "/summary", label: t("bottomNav.summary"), icon: FaChartPie },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
            <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl shadow-black/10" />
            <div className="relative flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-300 w-full",
                                isActive
                                    ? "text-accent-primary bg-accent-primary/15"
                                    : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:hover:bg-white/5"
                            )}
                        >
                            <item.icon className={clsx("text-xl transition-transform duration-300", isActive && "scale-110")} />
                            <span className="text-[10px] font-bold tracking-wide text-center">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
