"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import Link from "next/link";
import { CATEGORIES, PAYMENT_TYPES } from "@/lib/constants";
import CurrencyInput from "@/components/CurrencyInput";
import toast from "react-hot-toast";

export default function AddExpensePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        category: "",
        paymentType: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                type: "expense",
                userId: user.uid,
                category: formData.category,
                paymentMethod: formData.paymentType,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date),
                description: formData.description,
                createdAt: serverTimestamp()
            });
            router.push("/expenses");
        } catch (error) {
            console.error("Error adding expense:", error);
            toast.error("Hata oluştu, lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/expenses" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-3xl font-bold">Yeni Harcama Ekle</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl space-y-6 shadow-2xl shadow-[#71717114] dark:shadow-white/5 border border-gray-200 dark:border-white/10">
                {/* Category Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary ml-1">Kategori</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat })}
                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${formData.category === cat
                                    ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/25 scale-105 border border-transparent"
                                    : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 shadow-sm hover:border-accent-primary hover:text-accent-primary"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary ml-1">Ödeme Tipi</label>
                    <div className="flex flex-wrap gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                        {PAYMENT_TYPES.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentType: type })}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${formData.paymentType === type
                                    ? "bg-accent-secondary text-white shadow-lg shadow-accent-secondary/25 scale-105 border border-transparent"
                                    : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 shadow-sm hover:border-accent-secondary hover:text-accent-secondary"
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Tutar</label>
                        <CurrencyInput
                            value={formData.amount}
                            onChange={(val) => setFormData({ ...formData, amount: val })}
                            placeholder="0,00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Tarih</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Açıklama (İsteğe Bağlı)</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all resize-none h-24"
                        placeholder="Harcama detayı..."
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    isLoading={loading}
                    disabled={!formData.category || !formData.paymentType || !formData.amount}
                >
                    <FaSave />
                    Kaydet
                </Button>
            </form>
        </div>
    );
}
