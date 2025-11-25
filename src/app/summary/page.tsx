"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaArrowUp, FaArrowDown, FaWallet, FaLightbulb, FaChartPie, FaExclamationTriangle, FaTrophy, FaUtensils, FaShoppingBag, FaCar, FaHome, FaGamepad, FaHeartbeat, FaGraduationCap, FaPlane } from "react-icons/fa";
import clsx from "clsx";
import Loader from "@/components/Loader";
import { formatCurrency } from "@/lib/utils";
import AnalysisCharts from "@/components/summary/AnalysisCharts";

interface Transaction {
    id: string;
    type: "income" | "expense";
    amount: number;
    date: { seconds: number };
    category: string;
    description?: string;
}

interface MonthlyStats {
    income: number;
    expense: number;
    balance: number;
}

interface Insight {
    type: "positive" | "negative" | "neutral" | "warning";
    icon: React.ReactNode;
    title: string;
    message: string;
}

export default function SummaryPage() {
    const { user, loading: authLoading } = useAuth();
    const { privacyMode } = useTheme();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Transaction[];

            // Sort by date descending (client-side)
            data.sort((a, b) => {
                const dateA = new Date(a.date.seconds * 1000).getTime();
                const dateB = new Date(b.date.seconds * 1000).getTime();
                return dateB - dateA;
            });

            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    const handleMonthSelect = (index: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(index);
        setSelectedDate(newDate);
    };

    const handleYearChange = (increment: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(newDate.getFullYear() + increment);
        setSelectedDate(newDate);
    };

    // --- Data Processing ---

    const getStatsForMonth = (date: Date): MonthlyStats => {
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
        const monthlyTransactions = transactions.filter(t =>
            new Date(t.date.seconds * 1000).toISOString().slice(0, 7) === monthStr
        );

        const income = monthlyTransactions
            .filter(t => t.type === "income")
            .reduce((acc, curr) => acc + curr.amount, 0);

        const expense = monthlyTransactions
            .filter(t => t.type === "expense")
            .reduce((acc, curr) => acc + curr.amount, 0);

        return { income, expense, balance: income - expense };
    };

    const currentStats = getStatsForMonth(selectedDate);

    // Previous Month Stats for comparison
    const prevDate = new Date(selectedDate);
    prevDate.setMonth(selectedDate.getMonth() - 1);
    const prevStats = getStatsForMonth(prevDate);

    // Category Breakdown (Current Month)
    const currentMonthTransactions = transactions.filter(t =>
        new Date(t.date.seconds * 1000).toISOString().slice(0, 7) === selectedDate.toISOString().slice(0, 7)
    );

    const expenseCategories = currentMonthTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const topExpenses = Object.entries(expenseCategories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Monthly Trends (Last 6 Months)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - (5 - i));
        const stats = getStatsForMonth(d);
        return {
            month: months[d.getMonth()].slice(0, 3),
            income: stats.income,
            expense: stats.expense
        };
    });

    // --- Insights Logic ---
    const generateInsights = (): Insight[] => {
        const insights: Insight[] = [];
        const fmt = (val: number) => privacyMode ? "****" : formatCurrency(val);

        // 1. Balance Check
        if (currentStats.balance > 0) {
            insights.push({
                type: "positive",
                icon: <FaTrophy className="text-yellow-500" />,
                title: "Tebrikler!",
                message: `Bu ay gelirleriniz giderlerinizden ${fmt(currentStats.balance)} daha fazla. Harika gidiyorsunuz!`
            });
        } else if (currentStats.balance < 0) {
            insights.push({
                type: "warning",
                icon: <FaExclamationTriangle className="text-red-500" />,
                title: "Dikkat!",
                message: `Bu ay giderleriniz gelirlerinizi ${fmt(Math.abs(currentStats.balance))} aştı. Harcamalarınızı gözden geçirmek isteyebilirsiniz.`
            });
        }

        // 2. Expense Comparison
        if (prevStats.expense > 0) {
            const diff = currentStats.expense - prevStats.expense;
            const percent = (diff / prevStats.expense) * 100;

            if (diff > 0) {
                insights.push({
                    type: "negative",
                    icon: <FaArrowUp className="text-red-400" />,
                    title: "Harcamalar Arttı",
                    message: `Geçen aya göre harcamalarınız %${Math.abs(percent).toFixed(1)} (${fmt(diff)}) arttı.`
                });
            } else if (diff < 0) {
                insights.push({
                    type: "positive",
                    icon: <FaArrowDown className="text-green-400" />,
                    title: "Tasarruf Ettiniz",
                    message: `Geçen aya göre %${Math.abs(percent).toFixed(1)} (${fmt(Math.abs(diff))}) daha az harcadınız. Süper!`
                });
            }
        }

        // 3. Top Spending Category Insight
        if (topExpenses.length > 0) {
            const [topCategory, topAmount] = topExpenses[0];
            const percentOfTotal = (topAmount / currentStats.expense) * 100;

            if (percentOfTotal > 30) {
                insights.push({
                    type: "warning",
                    icon: <FaChartPie className="text-orange-400" />,
                    title: "Yüksek Kategori Harcaması",
                    message: `Bu ay harcamalarınızın %${percentOfTotal.toFixed(0)}'si "${topCategory}" kategorisine gitti. Bu kategoriyi biraz kısabilir misiniz?`
                });
            }
        }

        // 4. Income Comparison
        if (prevStats.income > 0 && currentStats.income > prevStats.income) {
            insights.push({
                type: "positive",
                icon: <FaWallet className="text-blue-400" />,
                title: "Gelir Artışı",
                message: `Gelirleriniz geçen aya göre arttı. Bereketli olsun!`
            });
        }

        return insights;
    };

    const insights = generateInsights();

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Aylık Özet & Analiz</h1>

            {/* Month & Year Selector */}
            <div className="glass p-2 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                        <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">&lt;</button>
                        <span className="text-lg font-bold px-2">{selectedDate.getFullYear()}</span>
                        <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">&gt;</button>
                    </div>
                </div>
                <div className="flex flex-1 overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar mask-linear-fade">
                    {months.map((month, index) => {
                        const isSelected = selectedDate.getMonth() === index;
                        const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedDate.getFullYear();
                        return (
                            <button
                                key={month}
                                onClick={() => handleMonthSelect(index)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                                    isSelected ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/25" :
                                        isCurrentMonth ? "border border-accent-primary/50 text-accent-primary bg-accent-primary/5" :
                                            "hover:bg-white/10 text-text-secondary hover:text-text-primary"
                                )}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass p-5 rounded-2xl border-l-4 border-green-500 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FaArrowUp size={60} />
                            </div>
                            <p className="text-text-secondary text-sm font-medium">Toplam Gelir</p>
                            <p className="text-2xl font-bold text-green-500 mt-1">
                                {privacyMode ? "****" : `+${formatCurrency(currentStats.income)}`}
                            </p>
                        </div>
                        <div className="glass p-5 rounded-2xl border-l-4 border-red-500 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FaArrowDown size={60} />
                            </div>
                            <p className="text-text-secondary text-sm font-medium">Toplam Gider</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">
                                {privacyMode ? "****" : `-${formatCurrency(currentStats.expense)}`}
                            </p>
                        </div>
                        <div className={clsx(
                            "glass p-5 rounded-2xl border-l-4 relative overflow-hidden group",
                            currentStats.balance >= 0 ? "border-blue-500" : "border-orange-500"
                        )}>
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FaWallet size={60} />
                            </div>
                            <p className="text-text-secondary text-sm font-medium">Net Durum</p>
                            <p className={clsx("text-2xl font-bold mt-1", currentStats.balance >= 0 ? "text-blue-500" : "text-orange-500")}>
                                {privacyMode ? "****" : `${currentStats.balance >= 0 ? "+" : ""}${formatCurrency(currentStats.balance)}`}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <AnalysisCharts
                        expenseCategories={expenseCategories}
                        monthlyTrends={monthlyTrends}
                    />

                    {/* Top Expenses List */}
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold mb-4">En Çok Harcanan Kategoriler</h3>
                        {topExpenses.length > 0 ? (
                            <div className="space-y-4">
                                {topExpenses.map(([category, amount], index) => (
                                    <div key={category}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{category}</span>
                                            <span className="text-text-secondary">
                                                {privacyMode ? "****" : formatCurrency(amount)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full rounded-full",
                                                    index === 0 ? "bg-red-500" :
                                                        index === 1 ? "bg-orange-400" : "bg-yellow-400"
                                                )}
                                                style={{ width: `${(amount / currentStats.expense) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-center py-4">Bu ay henüz harcama yapılmamış.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Insights */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl h-full border border-accent-primary/20 bg-accent-primary/5">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <FaLightbulb className="text-yellow-400" />
                            Akıllı Analizler
                        </h3>

                        <div className="space-y-4">
                            {insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <div key={idx} className="flex gap-3 items-start py-3 border-b border-white/5 last:border-0 last:pb-0 first:pt-0">
                                        <div className="mt-1">
                                            {insight.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{insight.title}</h4>
                                            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                                                {insight.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <p>Analiz için yeterli veri bekleniyor...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
