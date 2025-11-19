"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import Link from "next/link";
import { FaPlus, FaSearch, FaFilter } from "react-icons/fa";

interface Transaction {
    id: string;
    category: string;
    amount: number;
    date: any;
    description: string;
    paymentMethod: string;
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            where("type", "==", "expense"),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Transaction[];
            setExpenses(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Harcamalarım</h1>
                <Link href="/expenses/new">
                    <Button className="gap-2">
                        <FaPlus /> Yeni Harcama
                    </Button>
                </Link>
            </div>

            {/* Filters & Search (Placeholder for now) */}
            <div className="glass p-4 rounded-xl flex gap-4 items-center">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Harcama ara..."
                        className="w-full bg-transparent border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-accent-primary outline-none transition-colors"
                    />
                </div>
                <Button variant="secondary" size="sm" className="gap-2">
                    <FaFilter /> Filtrele
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-10 text-text-secondary">
                    Henüz harcama kaydı bulunmuyor.
                </div>
            ) : (
                <div className="grid gap-4">
                    {expenses.map((expense) => (
                        <div key={expense.id} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xl">
                                    {/* Icon based on category could go here */}
                                    ₺
                                </div>
                                <div>
                                    <h3 className="font-bold">{expense.category}</h3>
                                    <p className="text-sm text-text-secondary">{expense.description || expense.paymentMethod}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-red-400">
                                    -{expense.amount.toFixed(2)} ₺
                                </div>
                                <div className="text-xs text-text-secondary">
                                    {new Date(expense.date.seconds * 1000).toLocaleDateString("tr-TR")}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
