"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import Link from "next/link";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaSave, FaTimes, FaCheck } from "react-icons/fa";
import { INCOME_CATEGORIES, PAYMENT_TYPES } from "@/lib/constants";
import CustomSelect from "@/components/CustomSelect";
import clsx from "clsx";
import { formatCurrency } from "@/lib/utils";
import ConfirmationModal from "@/components/ConfirmationModal";
import Loader from "@/components/Loader";

interface Transaction {
    id: string;
    category: string;
    amount: number;
    date: { seconds: number };
    description: string;
    paymentMethod?: string;
}

export default function IncomesPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const [incomes, setIncomes] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Date Filter State
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Edit/Delete States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Transaction>>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Reset Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const months = Array.from({ length: 12 }, (_, i) => {
        return new Date(0, i).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR', { month: 'long' });
    });

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

    const handleResetClick = () => {
        if (!user || incomes.length === 0) return;
        setIsResetModalOpen(true);
    };

    const handleConfirmReset = async () => {
        try {
            setLoading(true);
            // Delete all currently loaded incomes (which are already filtered by month/year in the query)
            const deletePromises = incomes.map(income =>
                deleteDoc(doc(db, "transactions", income.id))
            );

            await Promise.all(deletePromises);
            setIsResetModalOpen(false);
        } catch (error) {
            console.error("Error resetting month:", error);
            alert(t("incomesPage.resetError"));
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Calculate start and end of the selected month
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

            const q = query(
                collection(db, "transactions"),
                where("userId", "==", user.uid),
                where("type", "==", "income"),
                where("date", ">=", startOfMonth),
                where("date", "<=", endOfMonth),
                orderBy("date", "desc")
            );

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...(doc.data() as Omit<Transaction, "id">),
                    }));
                    setIncomes(data);
                    setLoading(false);
                },
                (err) => {
                    console.error("Snapshot error:", err);
                    setError(err.message);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (err: unknown) {
            console.error("Query creation error:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
            setLoading(false);
        }
    }, [user, authLoading, selectedDate]);

    // Filter Logic
    const filteredIncomes = incomes.filter((income) => {
        const matchesSearch =
            (income.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (income.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory ? income.category === selectedCategory : true;

        return matchesSearch && matchesCategory;
    });

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
    };

    const handleEditClick = (income: Transaction) => {
        setEditingId(income.id);
        setEditForm({
            amount: income.amount,
            category: income.category,
            description: income.description,
            paymentMethod: income.paymentMethod
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleUpdate = async () => {
        if (!editingId || !user) return;

        try {
            const incomeRef = doc(db, "transactions", editingId);
            await updateDoc(incomeRef, {
                ...editForm,
                amount: Number(editForm.amount)
            });
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error("Error updating document: ", error);
            alert(t("incomesPage.updateError"));
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteDoc(doc(db, "transactions", deletingId));
            setDeletingId(null);
            if (expandedId === deletingId) {
                setExpandedId(null);
            }
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert(t("incomesPage.deleteError"));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">{t("incomesPage.title")}</h1>
                <div className="flex gap-2">
                    {incomes.length > 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleResetClick}
                            className="gap-2 text-red-500"
                            title={t("incomesPage.deleteAllMonth")}
                        >
                            <FaTrash /> <span className="hidden sm:inline">{t("incomesPage.deleteAllMonth")}</span>
                        </Button>
                    )}
                    <Link href="/incomes/new">
                        <Button className="gap-2 bg-accent-secondary shadow-accent-secondary/20">
                            <FaPlus /> {t("incomesPage.newIncome")}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Month & Year Selector */}
            <div className="glass p-2 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-4 shrink-0">
                    {/* Year Selector */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => handleYearChange(-1)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            &lt;
                        </button>
                        <span className="text-lg font-bold px-2">{selectedDate.getFullYear()}</span>
                        <button
                            onClick={() => handleYearChange(1)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            &gt;
                        </button>
                    </div>
                </div>

                {/* Month List */}
                <div className="flex flex-1 overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar mask-linear-fade">
                    {months.map((month, index) => {
                        const isSelected = selectedDate.getMonth() === index;
                        const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedDate.getFullYear();

                        return (
                            <button
                                key={month}
                                onClick={() => handleMonthSelect(index)}
                                className={clsx(
                                    "px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                                    isSelected
                                        ? "bg-accent-secondary text-white shadow-lg shadow-accent-secondary/25"
                                        : isCurrentMonth
                                            ? "border border-accent-secondary/50 text-accent-secondary bg-accent-secondary/5 hover:bg-accent-secondary/10"
                                            : "hover:bg-white/10 text-text-secondary hover:text-text-primary"
                                )}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="glass p-4 rounded-xl flex flex-col md:flex-row gap-4 relative z-20">
                {/* Search */}
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={t("incomesPage.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-accent-secondary outline-none transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <CustomSelect
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={INCOME_CATEGORIES.map(c => ({ value: c, label: c }))}
                        placeholder={t("incomesPage.allCategories")}
                    />

                    {(searchTerm || selectedCategory) && (
                        <Button variant="ghost" onClick={clearFilters} className="px-3 h-[42px]">
                            {t("incomesPage.clear")}
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-center">
                    <p className="font-bold">{t("incomesPage.error")}:</p>
                    <p className="text-sm">{error}</p>
                    {error.includes("index") && (
                        <p className="text-xs mt-2">
                            Bu hata genellikle eksik veritabanı indeksinden kaynaklanır. Lütfen konsolu kontrol edin ve Firebase konsolunda indeksi oluşturun.
                        </p>
                    )}
                </div>
            ) : loading ? (
                <Loader />
            ) : filteredIncomes.length === 0 ? (
                <div className="text-center py-10 text-text-secondary bg-white/5 rounded-xl border border-white/5">
                    {incomes.length === 0 ? t("incomesPage.noIncomes") : t("incomesPage.noResults")}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredIncomes.map((income) => {
                        const isExpanded = expandedId === income.id;

                        return (
                            <div
                                key={income.id}
                                onClick={() => setExpandedId(isExpanded ? null : income.id)}
                                className={clsx(
                                    "glass rounded-xl transition-all duration-300 cursor-pointer overflow-hidden",
                                    isExpanded ? "bg-white/10 ring-1 ring-accent-secondary shadow-lg shadow-accent-secondary/10" : "hover:bg-white/5 hover:scale-[1.01] hover:shadow-md"
                                )}
                            >
                                {/* Main Row */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors",
                                            isExpanded ? "bg-green-500 text-white" : "bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-500"
                                        )}>
                                            ₺
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate text-lg">{income.category}</h3>
                                            <p className="text-sm text-text-secondary">{income.paymentMethod || income.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-green-500 dark:text-green-400 text-lg">
                                            +{formatCurrency(income.amount)}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {new Date(income.date.seconds * 1000).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <div className={clsx(
                                    "grid transition-all duration-300 ease-in-out bg-black/5 dark:bg-white/5",
                                    isExpanded ? "grid-rows-[1fr] opacity-100 border-t border-gray-100 dark:border-white/5" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="p-4">
                                            {editingId === income.id ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="number"
                                                            value={editForm.amount}
                                                            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                                                            className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                                            placeholder={t("incomesPage.amount")}
                                                        />
                                                        <CustomSelect
                                                            value={editForm.category || ""}
                                                            onChange={(val) => setEditForm({ ...editForm, category: val })}
                                                            options={INCOME_CATEGORIES.map(c => ({ value: c, label: c }))}
                                                            placeholder={t("incomesPage.category")}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={editForm.description || ""}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                                        placeholder={t("incomesPage.description")}
                                                    />
                                                    <CustomSelect
                                                        value={editForm.paymentMethod || ""}
                                                        onChange={(val) => setEditForm({ ...editForm, paymentMethod: val })}
                                                        options={PAYMENT_TYPES.map(t => ({ value: t, label: t }))}
                                                        placeholder={t("incomesPage.paymentMethod")}
                                                    />
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                                            {t("common.cancel")}
                                                        </Button>
                                                        <Button size="sm" onClick={handleUpdate} className="gap-2 bg-accent-secondary">
                                                            <FaSave /> {t("common.save")}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-3 text-sm flex-1">
                                                        {income.description && (
                                                            <div>
                                                                <span className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{t("incomesPage.description")}</span>
                                                                <p className="text-text-primary">{income.description}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-xs text-text-secondary pt-2">
                                                            <span>{t("incomesPage.transactionId")}: {income.id.slice(0, 8)}...</span>
                                                            <span>{new Date(income.date.seconds * 1000).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 ml-4">
                                                        {deletingId === income.id ? (
                                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                                                                <span className="text-xs text-red-500 font-medium">{t("incomesPage.deleteConfirm")}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleConfirmDelete();
                                                                    }}
                                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                                >
                                                                    <FaCheck size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeletingId(null);
                                                                    }}
                                                                    className="p-2 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                                                                >
                                                                    <FaTimes size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditClick(income);
                                                                    }}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                    title={t("common.edit")}
                                                                >
                                                                    <FaEdit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteClick(income.id);
                                                                    }}
                                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title={t("common.delete")}
                                                                >
                                                                    <FaTrash size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleConfirmReset}
                title={t("incomesPage.deleteMonthConfirmTitle")}
                message={t("incomesPage.deleteMonthConfirmMessage").replace("{date}", `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`)}
                confirmText={t("incomesPage.confirmDelete")}
                variant="danger"
            />
        </div>
    );
}
