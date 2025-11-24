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
        dueDate: ""
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const debtData = {
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

            await addDoc(collection(db, "debts"), debtData);
            router.push("/portfolio");
        } catch (error: any) {
            console.error("Error adding debt:", error);
            if (error.code === "permission-denied") {
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
