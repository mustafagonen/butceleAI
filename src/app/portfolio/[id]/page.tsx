"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import SearchableSelect from "@/components/SearchableSelect";
import CurrencyInput from "@/components/CurrencyInput";
import { BIST_STOCKS, TEFAS_FUNDS } from "@/lib/market-data";
import Loader from "@/components/Loader";

const ASSET_TYPES = [
    { value: "tl", label: "Nakit (TL)" },
    { value: "gold", label: "Altın" },
    { value: "stock", label: "Hisse Senedi" },
    { value: "fund", label: "Yatırım Fonu" },
    { value: "crypto", label: "Kripto Para" },
    { value: "bes", label: "BES" },
    { value: "real_estate", label: "Gayrimenkul" },
    { value: "vehicle", label: "Araç" }
];

const REAL_ESTATE_TYPES = [
    { value: "house", label: "Daire" },
    { value: "villa", label: "Villa" },
    { value: "land", label: "Arsa" },
    { value: "shop", label: "Dükkan" }
];

const GOLD_TYPES = [
    { value: "24k", label: "24 Ayar (Saf)" },
    { value: "22k", label: "22 Ayar (Bilezik)" },
    { value: "gram", label: "Gram Altın" },
    { value: "ceyrek", label: "Çeyrek Altın" }
];

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuth();
    const router = useRouter();
    const resolvedParams = use(params);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        type: "",
        name: "",
        code: "",
        amount: "",
        subType: ""
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAsset = async () => {
            if (!user) return;

            try {
                const docRef = doc(db, "assets", resolvedParams.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.userId !== user.uid) {
                        router.push("/portfolio");
                        return;
                    }

                    // Determine subType for gold if possible, or just load data
                    let subType = "";
                    if (data.type === "gold" && data.name.includes("(")) {
                        const match = data.name.match(/\((.*?)\)/);
                        if (match) {
                            const foundType = GOLD_TYPES.find(t => t.label === match[1]);
                            if (foundType) subType = foundType.value;
                        }
                    }

                    setFormData({
                        type: data.type === "bes" && TEFAS_FUNDS.find(f => f.value === data.code) ? "fund" : data.type,
                        name: data.name,
                        code: data.code || "",
                        amount: data.amount.toString(),
                        subType: subType
                    });
                } else {
                    setError("Varlık bulunamadı.");
                }
            } catch (err) {
                console.error("Error fetching asset:", err);
                setError("Varlık yüklenirken hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [user, resolvedParams.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            // Construct the asset object
            const assetData: Record<string, unknown> = {
                type: formData.type === "fund" ? "bes" : formData.type,
                amount: parseFloat(formData.amount),
                updatedAt: serverTimestamp()
            };

            // Customize based on type
            if (formData.type === "tl") {
                assetData.name = "Nakit Birikim";
                assetData.code = "TRY";
            } else if (formData.type === "gold") {
                assetData.name = formData.subType ? `Altın (${GOLD_TYPES.find(t => t.value === formData.subType)?.label})` : "Altın";
                assetData.code = "GA";
            } else if (formData.type === "stock") {
                const stock = BIST_STOCKS.find(s => s.value === formData.code);
                assetData.name = stock ? stock.label.split(" - ")[1] : formData.code;
                assetData.code = formData.code;
            } else if (formData.type === "fund") {
                const fund = TEFAS_FUNDS.find(f => f.value === formData.code);
                assetData.name = fund ? fund.label : formData.code;
                assetData.code = formData.code;
                assetData.type = "bes";
            } else if (formData.type === "real_estate") {
                assetData.name = formData.name;
                assetData.code = "RE";
                assetData.amount = parseFloat(formData.amount);
            } else if (formData.type === "vehicle") {
                assetData.name = formData.name;
                assetData.code = "VEHICLE";
                assetData.amount = parseFloat(formData.amount);
            } else {
                assetData.name = formData.name;
                assetData.code = formData.code.toUpperCase();
            }

            const docRef = doc(db, "assets", resolvedParams.id);
            await updateDoc(docRef, assetData);
            router.push("/portfolio");
        } catch (error: unknown) {
            console.error("Error updating asset:", error);
            if (error instanceof Error && 'code' in error && (error as { code: string }).code === "permission-denied") {
                setError("Yetki hatası: Lütfen veritabanı kurallarının güncellendiğinden emin olun.");
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/portfolio" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-3xl font-bold">Varlık Düzenle</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl space-y-6 shadow-2xl border border-gray-200 dark:border-white/10">

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Asset Type - Disabled for edit to simplify logic, or enable if needed but might require reset */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Varlık Türü</label>
                    <CustomSelect
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val })}
                        options={ASSET_TYPES}
                        placeholder="Seçiniz"
                    />
                    <p className="text-xs text-text-secondary">Tür değişikliği yapabilirsiniz ancak alanları dikkatli kontrol ediniz.</p>
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

                {formData.type === "real_estate" && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Gayrimenkul Türü</label>
                            <CustomSelect
                                value={formData.subType}
                                onChange={(val) => setFormData({ ...formData, subType: val })}
                                options={REAL_ESTATE_TYPES}
                                placeholder="Seçiniz"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Tanım / İsim</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="Örn: Kadıköy Daire"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Tahmini Değer (TL)</label>
                            <CurrencyInput
                                value={formData.amount}
                                onChange={(val) => setFormData({ ...formData, amount: val })}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </>
                )}

                {formData.type === "vehicle" && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Tanım / İsim</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 outline-none focus:border-accent-primary"
                                placeholder="Örn: 34 ABC 123"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Tahmini Değer (TL)</label>
                            <CurrencyInput
                                value={formData.amount}
                                onChange={(val) => setFormData({ ...formData, amount: val })}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    isLoading={saving}
                >
                    <FaSave />
                    Güncelle
                </Button>
            </form>
        </div>
    );
}
