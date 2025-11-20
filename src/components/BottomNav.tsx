"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaWallet, FaChartPie, FaHome, FaList } from "react-icons/fa";
import clsx from "clsx";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/dashboard", label: "Panel", icon: FaHome },
        { href: "/incomes", label: "Gelir", icon: FaWallet },
        { href: "/expenses", label: "Gider", icon: FaList },
        { href: "/summary", label: "Özet", icon: FaChartPie },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-white/95 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10" />
            <div className="relative flex justify-around items-center p-2 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                                isActive
                                    ? "text-accent-primary bg-accent-primary/10"
                                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                            )}
                        >
                            <item.icon className={clsx("text-xl", isActive && "animate-pulse")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
