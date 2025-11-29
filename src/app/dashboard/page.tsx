"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaArrowUp, FaArrowDown, FaWallet, FaPiggyBank, FaPercent, FaCalendarAlt, FaList, FaPlus, FaMinus } from "react-icons/fa";
import clsx from "clsx";
import Link from "next/link";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import { formatCurrency } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/translationUtils";

interface Transaction {
    id: string;
    type: "income" | "expense";
    amount: number;
    date: { seconds: number };
    category: string;
    description?: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { privacyMode } = useTheme();
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
                ...(doc.data() as Omit<Transaction, "id">),
            }));

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

    if (loading) return <Loader />;

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

    // Helper to mask values
    const maskCurrency = (val: number) => privacyMode ? "***" : formatCurrency(val);
    const maskNumber = (val: number | string) => privacyMode ? "***" : val;
    const maskDate = (date: Date) => privacyMode ? "**/**/****" : date.toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long' });

    return (
        <div className="space-y-8">
            {/* Header with Gradient Text & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-blue-500 to-blue-600">
                            {t("dashboard.welcome").replace("{name}", user?.displayName?.split(" ")[0] || "Kullanıcı")}
                        </span>
                    </h1>
                    <p className="text-text-secondary text-lg">{t("dashboard.subtitle")}</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Link href="/incomes/new">
                        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20">
                            <FaPlus /> {t("dashboard.newIncome")}
                        </Button>
                    </Link>

                    <Link href="/expenses/new">
                        <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/20">
                            <FaPlus /> {t("dashboard.newExpense")}
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
                                + {t("dashboard.income")}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-text-primary">{maskCurrency(monthlyIncome)}</h3>
                            <p className="text-sm text-text-secondary mt-1">{t("dashboard.monthlyIncome")}</p>
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
                                - {t("dashboard.expense")}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-text-primary">{maskCurrency(monthlyExpense)}</h3>
                            <p className="text-sm text-text-secondary mt-1">{t("dashboard.monthlyExpense")}</p>
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
                                {t("dashboard.netStatus")}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className={clsx("text-3xl font-bold", monthlySavings >= 0 ? "text-accent-primary" : "text-red-500")}>
                                {maskCurrency(monthlySavings)}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">{t("dashboard.monthlySavings")}</p>
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
                                %{maskNumber(savingsRate.toFixed(1))}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">{t("dashboard.savingsRate")}</p>
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
                            {t("dashboard.recentTransactions")}
                        </h2>
                    </div>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden">
                        {recentTransactions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110",
                                                transaction.type === "income"
                                                    ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white"
                                                    : "bg-gradient-to-br from-red-400 to-rose-600 text-white"
                                            )}>
                                                {transaction.type === "income" ? <FaArrowUp /> : <FaArrowDown />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary text-lg">{getCategoryLabel(transaction.category, t)}</p>
                                                <p className="text-sm text-text-secondary">{maskDate(new Date(transaction.date.seconds * 1000))} • {transaction.description || t("common.noDescription")}</p>
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "font-bold text-xl",
                                            transaction.type === "income" ? "text-green-500" : "text-red-500"
                                        )}>
                                            {transaction.type === "income" ? "+" : "-"}{maskCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-text-secondary">
                                <p>{t("dashboard.noTransactions")}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yearly Summary - Featured Card */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FaCalendarAlt className="text-accent-secondary" />
                        {t("dashboard.yearlyOverview")}
                    </h2>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black text-white p-8 shadow-2xl">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent-primary rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-accent-secondary rounded-full blur-3xl opacity-20"></div>

                        <div className="relative z-10 space-y-8">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-wider font-medium">{t("dashboard.yearSummary").replace("{year}", currentYear)}</p>
                                <h3 className="text-xl font-bold mt-1">{t("dashboard.financialStatus")}</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col items-start gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-gray-300 text-sm">{t("dashboard.totalIncome")}</span>
                                    </div>
                                    <span className="font-bold text-green-400 text-lg">{maskCurrency(yearlyIncome)}</span>
                                </div>

                                <div className="flex flex-col items-start gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-gray-300 text-sm">{t("dashboard.totalExpense")}</span>
                                    </div>
                                    <span className="font-bold text-red-400 text-lg">{maskCurrency(yearlyExpense)}</span>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-gray-400 font-medium text-sm">{t("dashboard.netSavings")}</span>
                                        <span className={clsx("text-2xl font-bold", yearlySavings >= 0 ? "text-white" : "text-red-400")}>
                                            {maskCurrency(yearlySavings)}
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
