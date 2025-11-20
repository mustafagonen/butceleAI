"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import Link from "next/link";
import { FaPlus, FaSearch } from "react-icons/fa";
import { CATEGORIES, PAYMENT_TYPES } from "@/lib/constants";
import CustomSelect from "@/components/CustomSelect";
import clsx from "clsx";
import { formatCurrency } from "@/lib/utils";

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

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    // Filter Logic
    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            (expense.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (expense.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory ? expense.category === selectedCategory : true;
        const matchesPayment = selectedPaymentMethod ? expense.paymentMethod === selectedPaymentMethod : true;

        return matchesSearch && matchesCategory && matchesPayment;
    });

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
        setSelectedPaymentMethod("");
    };

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

            {/* Filters & Search */}
            <div className="glass p-4 rounded-xl flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Ara (Kategori, Açıklama)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-accent-primary outline-none transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <CustomSelect
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={CATEGORIES.map(c => ({ value: c, label: c }))}
                        placeholder="Tüm Kategoriler"
                    />

                    <CustomSelect
                        value={selectedPaymentMethod}
                        onChange={setSelectedPaymentMethod}
                        options={PAYMENT_TYPES.map(t => ({ value: t, label: t }))}
                        placeholder="Tüm Ödeme Tipleri"
                    />

                    {(searchTerm || selectedCategory || selectedPaymentMethod) && (
                        <Button variant="ghost" onClick={clearFilters} className="px-3 h-[42px]">
                            Temizle
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-text-secondary bg-white/5 rounded-xl border border-white/5">
                    {expenses.length === 0 ? "Henüz harcama kaydı bulunmuyor." : "Filtrelere uygun kayıt bulunamadı."}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredExpenses.map((expense) => {
                        const isExpanded = expandedId === expense.id;

                        return (
                            <div
                                key={expense.id}
                                onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                                className={clsx(
                                    "glass rounded-xl transition-all duration-300 cursor-pointer overflow-hidden",
                                    isExpanded ? "bg-white/10 ring-1 ring-accent-primary shadow-lg shadow-accent-primary/10" : "hover:bg-white/5 hover:scale-[1.01] hover:shadow-md"
                                )}
                            >
                                {/* Main Row */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors",
                                            isExpanded ? "bg-red-500 text-white" : "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-500"
                                        )}>
                                            ₺
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate text-lg">{expense.category}</h3>
                                            <p className="text-sm text-text-secondary">{expense.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-red-500 dark:text-red-400 text-lg">
                                            -{formatCurrency(expense.amount)}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {new Date(expense.date.seconds * 1000).toLocaleDateString("tr-TR")}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <div className={clsx(
                                    "grid transition-all duration-300 ease-in-out bg-black/5 dark:bg-white/5",
                                    isExpanded ? "grid-rows-[1fr] opacity-100 border-t border-gray-100 dark:border-white/5" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="p-4 space-y-3 text-sm">
                                            {expense.description && (
                                                <div>
                                                    <span className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Açıklama</span>
                                                    <p className="text-text-primary">{expense.description}</p>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-xs text-text-secondary pt-2">
                                                <span>İşlem ID: {expense.id.slice(0, 8)}...</span>
                                                <span>{new Date(expense.date.seconds * 1000).toLocaleString("tr-TR")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
