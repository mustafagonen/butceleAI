"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaArrowUp, FaArrowDown, FaWallet, FaCalendarAlt } from "react-icons/fa";
import clsx from "clsx";

interface Transaction {
    id: string;
    type: "income" | "expense";
    amount: number;
    date: any;
}

interface MonthlyStats {
    month: string; // YYYY-MM
    income: number;
    expense: number;
}

export default function SummaryPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Transaction[];
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Calculate stats
    const getMonthlyStats = (month: string) => {
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date.seconds * 1000).toISOString().slice(0, 7);
            return tDate === month;
        });

        const income = monthlyTransactions
            .filter(t => t.type === "income")
            .reduce((acc, curr) => acc + curr.amount, 0);

        const expense = monthlyTransactions
            .filter(t => t.type === "expense")
            .reduce((acc, curr) => acc + curr.amount, 0);

        return { income, expense, balance: income - expense };
    };

    const currentStats = getMonthlyStats(selectedMonth);

    // Get list of available months
    const availableMonths = Array.from(new Set(transactions.map(t =>
        new Date(t.date.seconds * 1000).toISOString().slice(0, 7)
    ))).sort().reverse();

    if (loading) return <div className="text-center py-10">Yükleniyor...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Aylık Özet</h1>

            {/* Month Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4">
                {availableMonths.map(month => (
                    <button
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        className={clsx(
                            "px-4 py-2 rounded-xl whitespace-nowrap transition-all border",
                            selectedMonth === month
                                ? "bg-accent-primary text-white border-accent-primary"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                    >
                        {new Date(month + "-01").toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                    </button>
                ))}
            </div>

            {/* Main Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Income Card */}
                <div className="glass p-6 rounded-2xl space-y-2 border-l-4 border-green-500">
                    <div className="flex items-center gap-2 text-green-400">
                        <FaArrowUp />
                        <span className="font-medium">Toplam Gelir</span>
                    </div>
                    <div className="text-3xl font-bold">{currentStats.income.toFixed(2)} ₺</div>
                </div>

                {/* Expense Card */}
                <div className="glass p-6 rounded-2xl space-y-2 border-l-4 border-red-500">
                    <div className="flex items-center gap-2 text-red-400">
                        <FaArrowDown />
                        <span className="font-medium">Toplam Gider</span>
                    </div>
                    <div className="text-3xl font-bold">{currentStats.expense.toFixed(2)} ₺</div>
                </div>

                {/* Balance Card */}
                <div className={clsx(
                    "glass p-6 rounded-2xl space-y-2 border-l-4",
                    currentStats.balance >= 0 ? "border-accent-primary" : "border-orange-500"
                )}>
                    <div className="flex items-center gap-2 text-accent-primary">
                        <FaWallet />
                        <span className="font-medium">Kalan Bakiye</span>
                    </div>
                    <div className="text-3xl font-bold">{currentStats.balance.toFixed(2)} ₺</div>
                </div>
            </div>

            {/* Chart Placeholder or Detailed Breakdown could go here */}
            <div className="glass p-8 rounded-2xl text-center text-text-secondary">
                <FaCalendarAlt className="mx-auto text-4xl mb-4 opacity-50" />
                <p>Bu ay için detaylı analizler yakında eklenecek.</p>
            </div>
        </div>
    );
}
