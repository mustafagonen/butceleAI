"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPlus, FaCreditCard, FaMoneyBillWave, FaUserFriends, FaQuestionCircle, FaTrash, FaArrowLeft, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import Link from "next/link";
import Loader from "@/components/Loader";
import { formatCurrency } from "@/lib/utils";
import { getGoldPrice, getCurrencyPrice } from "@/lib/finance";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Debt {
    id: string;
    type: "credit_card" | "loan" | "person" | "other";
    assetType?: "tl" | "gold" | "foreign_currency";
    currencyCode?: string;
    name: string;
    amount: number;
    currentValue?: number;
    unitPrice?: number;
    dueDate?: { seconds: number };
    isInstallment?: boolean;
    installmentCount?: number;
    firstInstallmentDate?: { seconds: number };
    installments?: Array<{
        amount: number;
        date: { seconds: number };
        isPaid?: boolean;
    }>;
    remainingAmount?: number;
}

export default function DebtsPage() {
    const { user, loading: authLoading } = useAuth();
    const { privacyMode } = useTheme();
    const { t } = useLanguage();
    const [rawDebts, setRawDebts] = useState<Debt[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Date Filter State
    const [selectedDate, setSelectedDate] = useState(new Date());

    const months = t("debtsPage.months") as unknown as string[];

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

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const qDebts = query(
            collection(db, "debts"),
            where("userId", "==", user.uid)
        );

        const unsubscribeDebts = onSnapshot(qDebts, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                assetType: "tl",
                currencyCode: "TRY",
                ...doc.data(),
            })) as Debt[];
            setRawDebts(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching debts:", error);
            setLoading(false);
        });

        return () => unsubscribeDebts();
    }, [user, authLoading]);

    useEffect(() => {
        if (rawDebts.length > 0) {
            updatePrices(rawDebts);
        } else {
            setDebts([]);
        }
    }, [rawDebts]);

    // Scroll to selected month
    useEffect(() => {
        const container = document.getElementById("month-scroll-container");
        const selected = document.getElementById("selected-month");

        if (container && selected) {
            const containerWidth = container.offsetWidth;
            const selectedLeft = selected.offsetLeft;
            const selectedWidth = selected.offsetWidth;

            // Center the selected item
            container.scrollTo({
                left: selectedLeft - (containerWidth / 2) + (selectedWidth / 2),
                behavior: "smooth"
            });
        }
    }, [selectedDate]);

    const updatePrices = async (currentDebts: Debt[]) => {
        const updatedDebts = await Promise.all(currentDebts.map(async (debt) => {
            let price = 1;

            try {
                if (debt.assetType === "gold") {
                    price = await getGoldPrice();
                } else if (debt.assetType === "foreign_currency" && debt.currencyCode) {
                    if (debt.currencyCode === "USD" || debt.currencyCode === "EUR") {
                        price = await getCurrencyPrice(debt.currencyCode as "USD" | "EUR");
                    }
                }
            } catch (e) {
                console.error("Debt price fetch error", e);
            }

            let remainingAmount = debt.amount;
            if (debt.isInstallment && debt.installments) {
                const paidAmount = debt.installments
                    .filter(inst => inst.isPaid)
                    .reduce((sum, inst) => sum + inst.amount, 0);
                remainingAmount = debt.amount - paidAmount;
            }

            const value = remainingAmount * price;
            return { ...debt, unitPrice: price, currentValue: value, remainingAmount };
        }));

        setDebts(updatedDebts);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, "debts", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting debt:", error);
        }
    };

    const handleInstallmentPayment = async (debtId: string, installmentIndex: number, isPaid: boolean) => {
        try {
            const debt = debts.find(d => d.id === debtId);
            if (!debt?.installments) return;

            const updatedInstallments = debt.installments.map((inst, idx) =>
                idx === installmentIndex ? { ...inst, isPaid } : inst
            );

            await updateDoc(doc(db, "debts", debtId), {
                installments: updatedInstallments,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating installment:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "credit_card": return <FaCreditCard />;
            case "loan": return <FaMoneyBillWave />;
            case "person": return <FaUserFriends />;
            default: return <FaQuestionCircle />;
        }
    };

    const getTypeLabel = (type: string) => {
        return t(`portfolio.types.${type}`) || t("portfolio.types.other");
    };

    const getCardStyle = (type: string) => {
        return "from-red-500/10 to-red-500/5 border-red-500/20 text-red-600 dark:text-red-400";
    };

    // Filter Logic
    const getMonthlyDebts = () => {
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        return debts.map(debt => {
            // If it's an installment debt
            if (debt.isInstallment && debt.installments) {
                // Find installment for this month
                const monthlyInstallmentIndex = debt.installments.findIndex(inst => {
                    const instDate = new Date(inst.date.seconds * 1000);
                    return instDate.getMonth() === selectedMonth && instDate.getFullYear() === selectedYear;
                });

                if (monthlyInstallmentIndex !== -1) {
                    const installment = debt.installments[monthlyInstallmentIndex];
                    return {
                        ...debt,
                        displayAmount: installment.amount,
                        displayDate: installment.date,
                        isMonthlyInstallment: true,
                        installmentIndex: monthlyInstallmentIndex,
                        isPaid: installment.isPaid
                    };
                }
            }
            // If it's a one-time debt
            else if (debt.dueDate) {
                const dueDate = new Date(debt.dueDate.seconds * 1000);
                if (dueDate.getMonth() === selectedMonth && dueDate.getFullYear() === selectedYear) {
                    return {
                        ...debt,
                        displayAmount: debt.remainingAmount !== undefined ? debt.remainingAmount : debt.amount,
                        displayDate: debt.dueDate,
                        isMonthlyInstallment: false,
                        isPaid: debt.remainingAmount === 0
                    };
                }
            }
            return null;
        }).filter(Boolean) as (Debt & { displayAmount: number, displayDate: { seconds: number }, isMonthlyInstallment: boolean, installmentIndex?: number, isPaid?: boolean })[];
    };

    const monthlyDebts = getMonthlyDebts();
    const monthlyTotal = monthlyDebts.reduce((sum, debt) => sum + (debt.isPaid ? 0 : debt.displayAmount), 0);

    // Helper to mask values
    const maskCurrency = (val: number) => privacyMode ? "***" : formatCurrency(val);
    const maskDate = (date: Date) => privacyMode ? "**/**/****" : date.toLocaleDateString("tr-TR");

    if (loading) return <Loader />;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/portfolio" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">{t("debtsPage.title")}</h1>
                </div>
                <Link
                    href="/portfolio/new-debt"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors"
                >
                    <FaPlus />
                    <span className="hidden sm:inline">{t("debtsPage.addDebt")}</span>
                </Link>
            </div>

            {/* Month & Year Selector */}
            <div className="glass p-2 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
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
                <div
                    id="month-scroll-container"
                    className="flex flex-1 w-full overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar mask-linear-fade scroll-smooth"
                >
                    {months.map((month, index) => {
                        const isSelected = selectedDate.getMonth() === index;
                        const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedDate.getFullYear();

                        return (
                            <button
                                key={month}
                                id={isSelected ? "selected-month" : ""}
                                onClick={() => handleMonthSelect(index)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                                    isSelected
                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                        : isCurrentMonth
                                            ? "border border-red-600/50 text-red-600 bg-red-600/5 hover:bg-red-600/10"
                                            : "hover:bg-white/10 text-text-secondary hover:text-text-primary"
                                )}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Monthly Total Card */}
            <div className="glass p-8 rounded-2xl border-l-4 border-red-500 relative overflow-hidden flex flex-col justify-center h-[140px]">
                <div className="absolute right-0 top-0 p-8 opacity-5">
                    <FaCreditCard size={100} />
                </div>
                <p className="text-text-secondary font-medium mb-2">{t("debtsPage.monthlyPayment")}</p>
                <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">{maskCurrency(monthlyTotal)}</h2>
            </div>

            {/* Debts List */}
            <div className="space-y-4">
                {monthlyDebts.length > 0 ? (
                    monthlyDebts.map((debt) => (
                        <div
                            key={`${debt.id}-${debt.installmentIndex}`}
                            className={clsx(
                                "relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg group overflow-hidden bg-gradient-to-br",
                                getCardStyle(debt.type)
                            )}
                        >
                            {/* Watermark Icon */}
                            <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110">
                                {getIcon(debt.type)}
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={clsx("p-3 rounded-xl text-xl bg-white/50 dark:bg-black/10 backdrop-blur-sm")}>
                                        {getIcon(debt.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary">{debt.name}</h3>
                                        <div className="flex flex-wrap gap-2 text-xs font-medium opacity-80">
                                            <span>{getTypeLabel(debt.type)}</span>
                                            {debt.isMonthlyInstallment && (
                                                <>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                                        {debt.installmentIndex! + 1}. {t("debtsPage.installment")}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs mt-1 opacity-70">
                                            {t("portfolio.lastPayment")}: {maskDate(new Date(debt.displayDate.seconds * 1000))}
                                        </p>

                                        {/* Show expandable indicator for installment debts */}
                                        {debt.isInstallment && debt.installments && debt.installments.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedId(expandedId === debt.id ? null : debt.id);
                                                }}
                                                className={clsx(
                                                    "mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2",
                                                    expandedId === debt.id
                                                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30"
                                                        : "bg-white/10 hover:bg-white/20 text-text-primary"
                                                )}
                                            >
                                                {expandedId === debt.id ? (
                                                    <>
                                                        <FaChevronUp size={10} />
                                                        <span>{t("debtsPage.hideInstallments")}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaChevronDown size={10} />
                                                        <span>{t("debtsPage.showInstallments")}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="flex flex-col items-end">
                                        <p className={clsx("font-bold text-lg", debt.isPaid ? "text-green-500 line-through opacity-50" : "text-text-primary")}>
                                            {maskCurrency(debt.displayAmount)}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {debt.isPaid ? t("debtsPage.paid") : t("debtsPage.toPay")}
                                        </p>
                                    </div>

                                    {/* Installment Checkbox or Delete Button */}
                                    <div className="mt-2 flex items-center gap-2">
                                        {debt.isMonthlyInstallment ? (
                                            <label className="relative flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={debt.isPaid || false}
                                                    onChange={(e) => handleInstallmentPayment(debt.id, debt.installmentIndex!, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2",
                                                    debt.isPaid
                                                        ? "bg-green-500 text-white"
                                                        : "bg-white/10 hover:bg-white/20 text-text-primary"
                                                )}>
                                                    {debt.isPaid ? (
                                                        <>
                                                            <FaCheck size={12} />
                                                            <span>{t("debtsPage.paid")}</span>
                                                        </>
                                                    ) : (
                                                        <span>{t("debtsPage.pay")}</span>
                                                    )}
                                                </div>
                                            </label>
                                        ) : (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                <button
                                                    onClick={() => setDeleteId(debt.id)}
                                                    className="p-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-lg transition-colors text-red-500"
                                                    title={t("common.delete")}
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Installment Details */}
                            {debt.isInstallment && debt.installments && expandedId === debt.id && (
                                <div className="mt-4 border-t border-white/10">
                                    <div className="flex items-start gap-4">
                                        <div className={clsx("p-3 rounded-xl text-xl bg-white/50 dark:bg-black/10 backdrop-blur-sm opacity-0")}>
                                            {getIcon(debt.type)}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-xs mb-3">
                                                <span className="opacity-70">{t("debtsPage.totalDebt")}:</span>
                                                <span className="font-medium">{maskCurrency(debt.amount)}</span>
                                            </div>
                                            {debt.remainingAmount !== undefined && debt.remainingAmount !== debt.amount && (
                                                <div className="flex justify-between text-xs mb-3">
                                                    <span className="opacity-70">{t("debtsPage.remainingDebt")}:</span>
                                                    <span className="font-bold text-red-600 dark:text-red-400">
                                                        {maskCurrency(debt.remainingAmount)}
                                                    </span>
                                                </div>
                                            )}
                                            {debt.remainingAmount === 0 && (
                                                <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-xs font-semibold">Borç Tamamlandı! 🎉</span>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-xs font-medium mb-2 opacity-90">Tüm Taksitler:</p>
                                            <div className="max-h-60 overflow-y-auto space-y-2 text-xs pr-2 scrollbar-thin">
                                                {debt.installments.map((inst, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 group/installment">
                                                        <label className="relative flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={inst.isPaid || false}
                                                                onChange={(e) => handleInstallmentPayment(debt.id, idx, e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-5 h-5 border-2 border-gray-300 dark:border-white/20 rounded-md peer-checked:bg-green-500 peer-checked:border-green-500 transition-all duration-200 flex items-center justify-center peer-hover:border-green-400 peer-focus:ring-2 peer-focus:ring-green-500/20">
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-all duration-200 ${inst.isPaid ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </label>
                                                        <div className={`flex-1 flex justify-between items-center transition-all duration-200 ${inst.isPaid ? 'opacity-50 line-through' : 'opacity-70'}`}>
                                                            <span className="font-medium">
                                                                {maskCurrency(inst.amount)} - {maskDate(new Date(inst.date.seconds * 1000))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-text-secondary glass rounded-2xl">
                        <FaCreditCard className="mx-auto text-4xl mb-4 opacity-50" />
                        <p>{t("debtsPage.noDebts")}</p>
                    </div>
                )
                }
            </div >

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t("debtsPage.deleteDebt")}
                message={t("debtsPage.deleteConfirm")}
                variant="danger"
            />
        </div >
    );
}
