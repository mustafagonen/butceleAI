"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPlus, FaWallet, FaCoins, FaChartLine, FaBitcoin, FaPiggyBank, FaTrash, FaEdit, FaBuilding, FaQuestionCircle, FaArrowLeft, FaCar } from "react-icons/fa";
import Link from "next/link";
import Loader from "@/components/Loader";
import { formatCurrency } from "@/lib/utils";
import { getGoldPrice, getCryptoPrice, getStockPrice, getBesPrice } from "@/lib/finance";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Asset {
    id: string;
    type: "tl" | "gold" | "stock" | "crypto" | "bes" | "real_estate" | "vehicle";
    name: string;
    code?: string;
    amount: number;
    currentValue?: number; // Calculated
    unitPrice?: number; // Fetched
}

export default function AssetsPage() {
    const { user, loading: authLoading } = useAuth();
    const [rawAssets, setRawAssets] = useState<Asset[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalWealth, setTotalWealth] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const qAssets = query(
            collection(db, "assets"),
            where("userId", "==", user.uid)
        );

        const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Asset[];
            setRawAssets(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching assets:", error);
            setLoading(false);
        });

        return () => unsubscribeAssets();
    }, [user, authLoading]);

    useEffect(() => {
        if (rawAssets.length > 0) {
            updatePrices(rawAssets);
        } else {
            setAssets([]);
            setTotalWealth(0);
        }
    }, [rawAssets]);

    const updatePrices = async (currentAssets: Asset[]) => {
        setRefreshing(true);
        let newTotalWealth = 0;
        const updatedAssets = await Promise.all(currentAssets.map(async (asset) => {
            let price = 1; // Default for TL

            try {
                if (asset.type === "gold") {
                    price = await getGoldPrice();
                } else if (asset.type === "crypto" && asset.code) {
                    price = await getCryptoPrice(asset.code);
                } else if (asset.type === "stock" && asset.code) {
                    price = await getStockPrice(asset.code);
                } else if (asset.type === "bes" && asset.code) {
                    price = await getBesPrice(asset.code);
                }
            } catch (e) {
                console.error("Price fetch error", e);
            }

            const value = asset.amount * price;
            newTotalWealth += value;
            return { ...asset, unitPrice: price, currentValue: value };
        }));

        setAssets(updatedAssets);
        setTotalWealth(newTotalWealth);
        setRefreshing(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, "assets", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting asset:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "tl": return <FaWallet />;
            case "gold": return <FaCoins />;
            case "stock": return <FaChartLine />;
            case "crypto": return <FaBitcoin />;
            case "bes": return <FaPiggyBank />;
            case "real_estate": return <FaBuilding />;
            case "vehicle": return <FaCar />;
            default: return <FaQuestionCircle />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "tl": return "Nakit (TL)";
            case "gold": return "Altın";
            case "stock": return "Hisse Senedi";
            case "crypto": return "Kripto Para";
            case "bes": return "BES / Fon";
            case "real_estate": return "Gayrimenkul";
            case "vehicle": return "Araç";
            default: return "Diğer";
        }
    };

    const getCardStyle = (type: string) => {
        switch (type) {
            case "tl": return "from-green-500/10 to-green-500/5 border-green-500/20 text-green-600 dark:text-green-400";
            case "gold": return "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
            case "stock": return "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400";
            case "crypto": return "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400";
            case "bes": return "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400";
            case "real_estate": return "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400";
            case "vehicle": return "from-teal-500/10 to-teal-500/5 border-teal-500/20 text-teal-600 dark:text-teal-400";
            default: return "from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-600 dark:text-gray-400";
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/portfolio" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">Varlıklarım</h1>
                </div>
                <Link
                    href="/portfolio/new"
                    className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white px-4 py-2 rounded-xl transition-colors"
                >
                    <FaPlus />
                    <span className="hidden sm:inline">Varlık Ekle</span>
                </Link>
            </div>

            {/* Total Wealth Card */}
            <div className="glass p-8 rounded-2xl border-l-4 border-accent-primary relative overflow-hidden flex flex-col justify-center">
                <div className="absolute right-0 top-0 p-8 opacity-5">
                    <FaWallet size={100} />
                </div>
                <p className="text-text-secondary font-medium mb-2">Toplam Varlık Değeri</p>
                <div className="flex items-end gap-4">
                    <h2 className="text-3xl font-bold">{formatCurrency(totalWealth)}</h2>
                    <button
                        onClick={() => updatePrices(rawAssets)}
                        disabled={refreshing}
                        className="text-xs text-accent-primary hover:underline mb-2 disabled:opacity-50"
                    >
                        {refreshing ? "..." : "Güncelle"}
                    </button>
                </div>
            </div>

            {/* Assets List */}
            <div className="space-y-4">
                {assets.length > 0 ? (
                    assets.map((asset) => (
                        <div
                            key={asset.id}
                            className={clsx(
                                "relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg group overflow-hidden bg-gradient-to-br",
                                getCardStyle(asset.type)
                            )}
                        >
                            {/* Watermark Icon */}
                            <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110">
                                {getIcon(asset.type)}
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={clsx("p-3 rounded-xl text-xl bg-white/50 dark:bg-black/10 backdrop-blur-sm")}>
                                        {getIcon(asset.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary">{asset.name}</h3>
                                        <div className="flex flex-wrap gap-2 text-xs font-medium opacity-80">
                                            <span>{getTypeLabel(asset.type)}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span>
                                                {asset.type === "real_estate" || asset.type === "tl" || asset.type === "vehicle"
                                                    ? ""
                                                    : `${asset.amount} ${asset.type === "gold" ? "gr" : "adet"}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <p className="font-bold text-lg text-text-primary">{formatCurrency(asset.currentValue || 0)}</p>

                                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <Link
                                            href={`/portfolio/${asset.id}`}
                                            className="p-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-lg transition-colors text-blue-500"
                                            title="Düzenle"
                                        >
                                            <FaEdit size={14} />
                                        </Link>
                                        <button
                                            onClick={() => setDeleteId(asset.id)}
                                            className="p-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-lg transition-colors text-red-500"
                                            title="Sil"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-text-secondary glass rounded-2xl">
                        <FaWallet className="mx-auto text-4xl mb-4 opacity-50" />
                        <p>Henüz bir varlık eklemediniz.</p>
                        <Link href="/portfolio/new" className="text-accent-primary hover:underline mt-2 inline-block">
                            İlk varlığını ekle
                        </Link>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Varlığı Sil"
                message="Bu varlığı portföyünüzden silmek istediğinize emin misiniz?"
                variant="danger"
            />
        </div>
    );
}
