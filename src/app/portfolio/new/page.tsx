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
import SearchableSelect from "@/components/SearchableSelect";
import CurrencyInput from "@/components/CurrencyInput";
import { BIST_STOCKS, TEFAS_FUNDS } from "@/lib/market-data";

const ASSET_TYPES = [
    { value: "tl", label: "Nakit (TL)" },
    { value: "gold", label: "Altın" },
    { value: "stock", label: "Hisse Senedi" },
    { value: "fund", label: "Yatırım Fonu" },
    { value: "crypto", label: "Kripto Para" },
    { value: "bes", label: "BES" }
];

const GOLD_TYPES = [
    { value: "24k", label: "24 Ayar (Saf)" },
    { value: "22k", label: "22 Ayar (Bilezik)" },
    { value: "gram", label: "Gram Altın" },
    { value: "ceyrek", label: "Çeyrek Altın" }
];

export default function AddAssetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        type: "tl",
        name: "",
        code: "",
        amount: "",
        subType: "" // For gold types or specific details
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Construct the asset object
            const assetData: any = {
                userId: user.uid,
                type: formData.type === "fund" ? "bes" : formData.type, // Map 'fund' to 'bes' structure or keep separate if needed. Using 'bes' logic for funds for now as they are similar (TEFAS)
                amount: parseFloat(formData.amount),
                updatedAt: serverTimestamp()
            };

            // Customize based on type
            if (formData.type === "tl") {
                assetData.name = "Nakit Birikim";
                assetData.code = "TRY";
            } else if (formData.type === "gold") {
                assetData.name = formData.subType ? `Altın (${GOLD_TYPES.find(t => t.value === formData.subType)?.label})` : "Altın";
                assetData.code = "GA"; // Default to Gram Altın code for fetcher
            } else if (formData.type === "stock") {
                const stock = BIST_STOCKS.find(s => s.value === formData.code);
                assetData.name = stock ? stock.label.split(" - ")[1] : formData.code;
                assetData.code = formData.code;
            } else if (formData.type === "fund") {
                const fund = TEFAS_FUNDS.find(f => f.value === formData.code);
                assetData.name = fund ? fund.label : formData.code;
                assetData.code = formData.code;
                assetData.type = "bes"; // Treat as BES/Fund for now in backend
            } else {
                assetData.name = formData.name;
                assetData.code = formData.code.toUpperCase();
            }

            await addDoc(collection(db, "assets"), assetData);
            router.push("/portfolio");
        } catch (error: any) {
            console.error("Error adding asset:", error);
            if (error.code === "permission-denied") {
                setError("Yetki hatası: Lütfen veritabanı kurallarının güncellendiğinden emin olun.");
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/portfolio" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-3xl font-bold">Yeni Varlık Ekle</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl space-y-6 shadow-2xl border border-gray-200 dark:border-white/10">

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Asset Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Varlık Türü</label>
                    <CustomSelect
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val, name: "", code: "", amount: "" })}
                        options={ASSET_TYPES}
                        placeholder="Seçiniz"
                    />
                </div>

                {/* Dynamic Fields */}
                {formData.type === "tl" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Miktar (TL)</label>
                        <CurrencyInput
                            value={formData.amount}
                            onChange={(val) => setFormData({ ...formData, amount: val })}
                            placeholder="0,00"
                            required
                        />
                    </div>
                )}

                {formData.type === "gold" && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Altın Türü</label>
                            <CustomSelect
                                value={formData.subType}
                                onChange={(val) => setFormData({ ...formData, subType: val })}
                                options={GOLD_TYPES}
                                placeholder="Seçiniz"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Miktar (Gram)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="Örn: 10.5"
                                required
                            />
                        </div>
                    </>
                )}

                {formData.type === "stock" && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Hisse Senedi</label>
                            <SearchableSelect
                                value={formData.code}
                                onChange={(val) => setFormData({ ...formData, code: val })}
                                options={BIST_STOCKS}
                                placeholder="Hisse Ara (Örn: THYAO)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Adet (Lot)</label>
                            <input
                                type="number"
                                step="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="0"
                                required
                            />
                        </div>
                    </>
                )}

                {formData.type === "fund" && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Yatırım Fonu</label>
                            <SearchableSelect
                                value={formData.code}
                                onChange={(val) => setFormData({ ...formData, code: val })}
                                options={TEFAS_FUNDS}
                                placeholder="Fon Ara (Örn: AFT)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Adet (Pay)</label>
                            <input
                                type="number"
                                step="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="0"
                                required
                            />
                        </div>
                    </>
                )}

                {(formData.type === "crypto" || formData.type === "bes") && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{formData.type === "bes" ? "Fon Kodu" : "Sembol"}</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary uppercase"
                                placeholder={formData.type === "bes" ? "Örn: AFT" : "Örn: BTC"}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Adet</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">İsim (İsteğe Bağlı)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder={formData.type === "bes" ? "Fon Adı" : "Bitcoin"}
                            />
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full gap-2"
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
