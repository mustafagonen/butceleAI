"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaArrowUp, FaArrowDown, FaWallet, FaPiggyBank, FaPercent, FaCalendarAlt, FaList, FaPlus, FaMinus } from "react-icons/fa";
import clsx from "clsx";
import Link from "next/link";
import Button from "@/components/Button";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
    id: string;
    type: "income" | "expense";
    amount: number;
    date: any;
    category: string;
    description?: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch ALL transactions for the user (client-side filtering to avoid index issues)
        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Transaction[];

            // Sort by date descending
            data.sort((a, b) => {
                const dateA = new Date(a.date.seconds * 1000).getTime();
                const dateB = new Date(b.date.seconds * 1000).getTime();
                return dateB - dateA;
            });

            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return <div className="flex justify-center items-center min-h-[50vh]">Yükleniyor...</div>;

    // --- Calculations ---
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentYear = now.getFullYear().toString(); // YYYY

    // Monthly Stats
    const monthlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.date.seconds * 1000).toISOString().slice(0, 7);
        return tDate === currentMonth;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyExpense = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Yearly Stats
    const yearlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.date.seconds * 1000).getFullYear().toString();
        return tDate === currentYear;
    });

    const yearlyIncome = yearlyTransactions
        .filter(t => t.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0);

    const yearlyExpense = yearlyTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, curr) => acc + curr.amount, 0);

    const yearlySavings = yearlyIncome - yearlyExpense;

    // Recent Transactions (Top 5)
    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Header with Gradient Text & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-accent-primary to-accent-secondary">
                            Hoş Geldin, {user?.displayName?.split(" ")[0] || "Kullanıcı"}
                        </span>
                    </h1>
                    <p className="text-text-secondary text-lg">Finansal özgürlüğüne giden yolda bugünkü durumun.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Link href="/incomes/new">
                        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20">
                            <FaPlus /> Yeni Gelir
                        </Button>
                    </Link>

                    <Link href="/expenses/new">
                        <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/20">
                            <FaPlus /> Yeni Harcama
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Stats Grid - Futuristic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Income */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative h-full bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl text-green-600 dark:text-green-400">
                                <FaArrowUp className="text-xl" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                                + Gelir
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-text-primary">{formatCurrency(monthlyIncome)}</h3>
                            <p className="text-sm text-text-secondary mt-1">Bu ayki toplam gelir</p>
                        </div>
                    </div>
                </div>

                {/* Monthly Expense */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative h-full bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                                <FaArrowDown className="text-xl" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                                - Gider
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-text-primary">{formatCurrency(monthlyExpense)}</h3>
                            <p className="text-sm text-text-secondary mt-1">Bu ayki toplam harcama</p>
                        </div>
                    </div>
                </div>

                {/* Monthly Savings */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative h-full bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-accent-primary/10 rounded-xl text-accent-primary">
                                <FaWallet className="text-xl" />
                            </div>
                            <span className={clsx("text-xs font-medium px-2 py-1 rounded-lg", monthlySavings >= 0 ? "bg-accent-primary/10 text-accent-primary" : "bg-red-100 text-red-500")}>
                                Net Durum
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className={clsx("text-3xl font-bold", monthlySavings >= 0 ? "text-accent-primary" : "text-red-500")}>
                                {formatCurrency(monthlySavings)}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">Bu ayki net tasarruf</p>
                        </div>
                    </div>
                </div>

                {/* Savings Rate */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative h-full bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <FaPercent className="text-xl" />
                            </div>
                            <div className="w-12 h-12 relative flex items-center justify-center">
                                <svg className="transform -rotate-90 w-full h-full">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-white/10" />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * Math.min(savingsRate, 100)) / 100} className={clsx(savingsRate >= 20 ? "text-green-500" : savingsRate > 0 ? "text-yellow-500" : "text-red-500")} />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className={clsx("text-3xl font-bold", savingsRate >= 20 ? "text-green-500" : savingsRate > 0 ? "text-yellow-500" : "text-red-500")}>
                                %{savingsRate.toFixed(1)}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">Tasarruf oranı</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Recent Transactions - Glass List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <FaList className="text-accent-primary" />
                            Son Hareketler
                        </h2>
                    </div>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden">
                        {recentTransactions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {recentTransactions.map((t) => (
                                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110",
                                                t.type === "income"
                                                    ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white"
                                                    : "bg-gradient-to-br from-red-400 to-rose-600 text-white"
                                            )}>
                                                {t.type === "income" ? <FaArrowUp /> : <FaArrowDown />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary text-lg">{t.category}</p>
                                                <p className="text-sm text-text-secondary">{new Date(t.date.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} • {t.description || "Açıklama yok"}</p>
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "font-bold text-xl",
                                            t.type === "income" ? "text-green-500" : "text-red-500"
                                        )}>
                                            {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-text-secondary">
                                <p>Henüz bir hareket yok.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yearly Summary - Featured Card */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FaCalendarAlt className="text-accent-secondary" />
                        Yıllık Bakış
                    </h2>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black text-white p-8 shadow-2xl">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent-primary rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-accent-secondary rounded-full blur-3xl opacity-20"></div>

                        <div className="relative z-10 space-y-8">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-wider font-medium">{currentYear} ÖZETİ</p>
                                <h3 className="text-3xl font-bold mt-1">Finansal Durum</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-row items-center justify-between lg:flex-col lg:items-start lg:gap-2 xl:flex-row xl:items-center xl:justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-gray-300">Toplam Gelir</span>
                                    </div>
                                    <span className="font-bold text-green-400 text-lg">{formatCurrency(yearlyIncome)}</span>
                                </div>

                                <div className="flex flex-row items-center justify-between lg:flex-col lg:items-start lg:gap-2 xl:flex-row xl:items-center xl:justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-gray-300">Toplam Gider</span>
                                    </div>
                                    <span className="font-bold text-red-400 text-lg">{formatCurrency(yearlyExpense)}</span>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-400 font-medium">Net Tasarruf</span>
                                        <span className={clsx("text-3xl font-bold", yearlySavings >= 0 ? "text-white" : "text-red-400")}>
                                            {formatCurrency(yearlySavings)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
