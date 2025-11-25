"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import CurrencyInput from "@/components/CurrencyInput";
import { formatCurrency } from "@/lib/utils";

const DEBT_TYPES = [
    { value: "credit_card", label: "Kredi Kartı" },
    { value: "loan", label: "Kredi" },
    { value: "person", label: "Kişisel Borç" },
    { value: "other", label: "Diğer" }
];

export default function AddDebtPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        type: "credit_card",
        assetType: "tl", // tl, gold, foreign_currency
        currencyCode: "TRY", // TRY, USD, EUR, GA
        name: "",
        amount: "",
        dueDate: "",
        isInstallment: false,
        installmentCount: "",
        firstInstallmentDate: "",
        installments: [] as Array<{ amount: string; date: string }>
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const debtData: Record<string, unknown> = {
                userId: user.uid,
                type: formData.type,
                assetType: formData.assetType,
                currencyCode: formData.currencyCode,
                name: formData.name,
                amount: parseFloat(formData.amount), // This is the amount in the selected currency/unit
                dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add installment data if applicable
            if (formData.isInstallment && (formData.type === "loan" || formData.type === "credit_card" || formData.type === "person")) {
                debtData.isInstallment = true;
                debtData.installmentCount = parseInt(formData.installmentCount);
                debtData.firstInstallmentDate = formData.firstInstallmentDate ? new Date(formData.firstInstallmentDate) : null;
                debtData.installments = formData.installments.map(inst => ({
                    amount: parseFloat(inst.amount) || 0,
                    date: new Date(inst.date),
                    isPaid: false
                }));
            }

            await addDoc(collection(db, "debts"), debtData);
            router.push("/portfolio");
        } catch (error: unknown) {
            console.error("Error adding debt:", error);
            if (error instanceof Error && 'code' in error && (error as { code: string }).code === "permission-denied") {
                setError("Yetki hatası: Lütfen veritabanı kurallarının güncellendiğinden emin olun.");
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAssetTypeChange = (val: string) => {
        let code = "TRY";
        if (val === "gold") code = "GA";
        else if (val === "usd") code = "USD";
        else if (val === "eur") code = "EUR";

        setFormData({
            ...formData,
            assetType: val === "tl" ? "tl" : (val === "gold" ? "gold" : "foreign_currency"),
            currencyCode: code
        });
    };

    // Generate installment dates based on first installment date and count
    const generateInstallmentDates = (firstDate: string, count: number): string[] => {
        if (!firstDate || count <= 0) return [];
        const dates: string[] = [];
        const startDate = new Date(firstDate);

        for (let i = 0; i < count; i++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    // Handle installment count change
    const handleInstallmentCountChange = (count: string) => {
        const numCount = parseInt(count) || 0;
        const dates = generateInstallmentDates(formData.firstInstallmentDate, numCount);
        const newInstallments = dates.map((date, index) => ({
            amount: formData.installments[index]?.amount || "",
            date
        }));

        setFormData({
            ...formData,
            installmentCount: count,
            installments: newInstallments
        });
    };

    // Handle first installment date change
    const handleFirstInstallmentDateChange = (date: string) => {
        const numCount = parseInt(formData.installmentCount) || 0;
        const dates = generateInstallmentDates(date, numCount);
        const newInstallments = dates.map((d, index) => ({
            amount: formData.installments[index]?.amount || "",
            date: d
        }));

        setFormData({
            ...formData,
            firstInstallmentDate: date,
            installments: newInstallments
        });
    };

    // Handle individual installment amount change
    const handleInstallmentAmountChange = (index: number, amount: string) => {
        const newInstallments = [...formData.installments];
        newInstallments[index] = { ...newInstallments[index], amount };

        // If this is the first installment and others are empty, auto-fill them
        if (index === 0 && amount) {
            const shouldAutoFill = newInstallments.slice(1).every(inst => !inst.amount);
            if (shouldAutoFill) {
                newInstallments.forEach((inst, i) => {
                    if (i > 0) {
                        newInstallments[i] = { ...inst, amount };
                    }
                });
            }
        }

        // Calculate total amount
        const total = newInstallments.reduce((sum, inst) => {
            const val = parseFloat(inst.amount) || 0;
            return sum + val;
        }, 0);

        setFormData({
            ...formData,
            installments: newInstallments,
            amount: total.toString()
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/portfolio" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-3xl font-bold">Yeni Borç Ekle</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl space-y-6 shadow-2xl border border-gray-200 dark:border-white/10">

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Debt Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Borç Kategorisi</label>
                    <CustomSelect
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val })}
                        options={DEBT_TYPES}
                        placeholder="Seçiniz"
                    />
                </div>

                {/* Asset Type / Currency */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Borç Para Birimi / Cinsi</label>
                    <CustomSelect
                        value={formData.currencyCode === "TRY" ? "tl" : (formData.currencyCode === "GA" ? "gold" : (formData.currencyCode === "USD" ? "usd" : "eur"))}
                        onChange={handleAssetTypeChange}
                        options={[
                            { value: "tl", label: "Türk Lirası (TL)" },
                            { value: "usd", label: "Amerikan Doları (USD)" },
                            { value: "eur", label: "Euro (EUR)" },
                            { value: "gold", label: "Altın (Gram)" }
                        ]}
                        placeholder="Seçiniz"
                    />
                </div>

                {/* Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Borç Adı / Açıklama</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                        placeholder="Örn: Garanti Kredi Kartı"
                        required
                    />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                        {formData.currencyCode === "TRY" ? "Tutar (TL)" :
                            formData.currencyCode === "GA" ? "Miktar (Gram)" :
                                `Miktar (${formData.currencyCode})`}
                    </label>
                    {formData.currencyCode === "TRY" ? (
                        <CurrencyInput
                            value={formData.amount}
                            onChange={(val) => setFormData({ ...formData, amount: val })}
                            placeholder="0,00"
                            required
                        />
                    ) : (
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                            placeholder="0.00"
                            required
                        />
                    )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Son Ödeme Tarihi (İsteğe Bağlı)</label>
                    <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                    />
                </div>

                {/* Installment Option - For Loan, Credit Card, and Personal Debt */}
                {(formData.type === "loan" || formData.type === "credit_card" || formData.type === "person") && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isInstallment"
                                checked={formData.isInstallment}
                                onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-accent-primary focus:ring-accent-primary"
                            />
                            <label htmlFor="isInstallment" className="text-sm font-medium text-text-primary cursor-pointer">
                                Taksitli Ödeme
                            </label>
                        </div>

                        {formData.isInstallment && (
                            <div className="space-y-4 mt-4 pl-8">
                                {/* Installment Count */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Taksit Sayısı</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="60"
                                        value={formData.installmentCount}
                                        onChange={(e) => handleInstallmentCountChange(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                        placeholder="Örn: 12"
                                        required={formData.isInstallment}
                                    />
                                </div>

                                {/* First Installment Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">İlk Taksit Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.firstInstallmentDate}
                                        onChange={(e) => handleFirstInstallmentDateChange(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                        required={formData.isInstallment}
                                    />
                                </div>

                                {/* Installment Amounts */}
                                {formData.installments.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-text-secondary">
                                            Taksit Tutarları
                                            {formData.installments.length > 0 && (
                                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                                    (İlk taksiti girin, diğerleri otomatik doldurulacak)
                                                </span>
                                            )}
                                        </label>
                                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                            {formData.installments.map((installment, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-text-secondary min-w-[80px]">
                                                        {index + 1}. Taksit
                                                    </span>
                                                    <span className="text-xs text-text-secondary min-w-[90px]">
                                                        {new Date(installment.date).toLocaleDateString("tr-TR")}
                                                    </span>
                                                    {formData.currencyCode === "TRY" ? (
                                                        <CurrencyInput
                                                            value={installment.amount}
                                                            onChange={(val) => handleInstallmentAmountChange(index, val)}
                                                            placeholder="0,00"
                                                            required={formData.isInstallment}
                                                            className="flex-1 !p-2 !text-sm"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={installment.amount}
                                                            onChange={(e) => handleInstallmentAmountChange(index, e.target.value)}
                                                            className="flex-1 bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-2 text-sm outline-none focus:border-accent-primary"
                                                            placeholder="0.00"
                                                            required={formData.isInstallment}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {formData.amount && (
                                            <div className="pt-3 border-t border-gray-300 dark:border-white/10">
                                                <p className="text-sm font-medium text-text-primary">
                                                    Toplam Borç: {formData.currencyCode === "TRY"
                                                        ? formatCurrency(parseFloat(formData.amount) || 0)
                                                        : `${parseFloat(formData.amount).toFixed(2)} ${formData.currencyCode}`
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                    size="lg"
                    isLoading={loading}
                >
                    <FaSave />
                    Kaydet
                </Button>
            </form>
        </div>
    );
}
