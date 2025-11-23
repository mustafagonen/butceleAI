"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPlus, FaWallet, FaCoins, FaChartLine, FaBitcoin, FaPiggyBank, FaTrash } from "react-icons/fa";
import Link from "next/link";
import Loader from "@/components/Loader";
import { formatCurrency } from "@/lib/utils";
import { getGoldPrice, getCryptoPrice, getStockPrice, getBesPrice } from "@/lib/finance";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Asset {
    id: string;
    type: "tl" | "gold" | "stock" | "crypto" | "bes";
    name: string;
    code?: string;
    amount: number;
    currentValue?: number; // Calculated
    unitPrice?: number; // Fetched
}

export default function PortfolioPage() {
    const { user, loading: authLoading } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalWealth, setTotalWealth] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "assets"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Asset[];
            setAssets(data);
            setLoading(false);
            // Trigger price update when assets change
            updatePrices(data);
        }, (error) => {
            console.error("Error fetching assets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    const updatePrices = async (currentAssets: Asset[]) => {
        setRefreshing(true);
        let newTotal = 0;
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
            newTotal += value;
            return { ...asset, unitPrice: price, currentValue: value };
        }));

        setAssets(updatedAssets);
        setTotalWealth(newTotal);
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
            case "tl": return <FaWallet className="text-green-500" />;
            case "gold": return <FaCoins className="text-yellow-500" />;
            case "stock": return <FaChartLine className="text-blue-500" />;
            case "crypto": return <FaBitcoin className="text-orange-500" />;
            case "bes": return <FaPiggyBank className="text-purple-500" />;
            default: return <FaWallet />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "tl": return "Nakit (TL)";
            case "gold": return "Altın";
            case "stock": return "Hisse Senedi";
            case "crypto": return "Kripto Para";
            case "bes": return "BES / Fon";
            default: return "Diğer";
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Portföyüm</h1>
                <Link
                    href="/portfolio/new"
                    className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white px-4 py-2 rounded-xl transition-colors"
                >
                    <FaPlus />
                    <span className="hidden sm:inline">Varlık Ekle</span>
                </Link>
            </div>

            {/* Total Wealth Card */}
            <div className="glass p-8 rounded-2xl border-l-4 border-accent-primary relative overflow-hidden">
                <div className="absolute right-0 top-0 p-8 opacity-5">
                    <FaWallet size={100} />
                </div>
                <p className="text-text-secondary font-medium mb-2">Toplam Varlık Değeri</p>
                <div className="flex items-end gap-4">
                    <h2 className="text-4xl font-bold">{formatCurrency(totalWealth)}</h2>
                    <button
                        onClick={() => updatePrices(assets)}
                        disabled={refreshing}
                        className="text-sm text-accent-primary hover:underline mb-2 disabled:opacity-50"
                    >
                        {refreshing ? "Güncelleniyor..." : "Fiyatları Güncelle"}
                    </button>
                </div>
            </div>

            {/* Assets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.length > 0 ? (
                    assets.map((asset) => (
                        <div key={asset.id} className="glass p-5 rounded-xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-full text-xl">
                                    {getIcon(asset.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold">{asset.name}</h3>
                                    <p className="text-xs text-text-secondary">{getTypeLabel(asset.type)}</p>
                                    <div className="flex gap-2 text-sm mt-1 text-text-secondary">
                                        <span>{asset.amount} {asset.type === "gold" ? "gr" : "adet"}</span>
                                        {asset.unitPrice && asset.unitPrice > 1 && (
                                            <span>• {formatCurrency(asset.unitPrice)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{formatCurrency(asset.currentValue || 0)}</p>
                                <button
                                    onClick={() => setDeleteId(asset.id)}
                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm mt-1 hover:underline"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-text-secondary glass rounded-2xl">
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
