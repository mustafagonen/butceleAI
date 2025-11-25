"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPlus, FaWallet, FaCoins, FaChartLine, FaBitcoin, FaPiggyBank, FaTrash, FaEdit, FaBuilding, FaCreditCard, FaMoneyBillWave, FaUserFriends, FaQuestionCircle, FaDollarSign, FaEuroSign } from "react-icons/fa";
import Link from "next/link";
import Loader from "@/components/Loader";
import { formatCurrency } from "@/lib/utils";
import { getGoldPrice, getCryptoPrice, getStockPrice, getBesPrice, getCurrencyPrice } from "@/lib/finance";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";
import FinancialGoalCard from "@/components/FinancialGoalCard";

interface Asset {
    id: string;
    type: "tl" | "gold" | "stock" | "crypto" | "bes" | "real_estate";
    name: string;
    code?: string;
    amount: number;
    currentValue?: number; // Calculated
    unitPrice?: number; // Fetched
}

interface Debt {
    id: string;
    type: "credit_card" | "loan" | "person" | "other";
    assetType?: "tl" | "gold" | "foreign_currency";
    currencyCode?: string;
    name: string;
    amount: number; // Original amount (e.g. 100 USD) or total of all installments
    currentValue?: number; // Calculated TL value
    unitPrice?: number; // Exchange rate
    dueDate?: { seconds: number };
    isInstallment?: boolean;
    installmentCount?: number;
    firstInstallmentDate?: { seconds: number };
    installments?: Array<{
        amount: number;
        date: { seconds: number };
        isPaid?: boolean;
    }>;
    remainingAmount?: number; // Calculated: total - paid installments
}

export default function PortfolioPage() {
    const { user, loading: authLoading } = useAuth();
    const [rawAssets, setRawAssets] = useState<Asset[]>([]);
    const [rawDebts, setRawDebts] = useState<Debt[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalWealth, setTotalWealth] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<"asset" | "debt" | null>(null);

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

        const qDebts = query(
            collection(db, "debts"),
            where("userId", "==", user.uid)
        );

        const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Asset[];
            setRawAssets(data);
        }, (error) => {
            console.error("Error fetching assets:", error);
            setLoading(false);
        });

        const unsubscribeDebts = onSnapshot(qDebts, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                assetType: "tl", // Default for old records
                currencyCode: "TRY", // Default for old records
                ...doc.data(),
            })) as Debt[];
            setRawDebts(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching debts:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeAssets();
            unsubscribeDebts();
        };
    }, [user, authLoading]);

    // Effect to trigger price updates when raw data changes
    useEffect(() => {
        if (rawAssets.length > 0 || rawDebts.length > 0) {
            updatePrices(rawAssets, rawDebts);
        } else {
            setAssets([]);
            setDebts([]);
            setTotalWealth(0);
            setTotalDebt(0);
        }
    }, [rawAssets, rawDebts]);

    const updatePrices = async (currentAssets: Asset[], currentDebts: Debt[]) => {
        setRefreshing(true);

        // Update Assets
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

        // Update Debts
        let newTotalDebt = 0;
        const updatedDebts = await Promise.all(currentDebts.map(async (debt) => {
            let price = 1; // Default for TL

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

            // Calculate remaining amount (total - paid installments)
            let remainingAmount = debt.amount;
            if (debt.isInstallment && debt.installments) {
                const paidAmount = debt.installments
                    .filter(inst => inst.isPaid)
                    .reduce((sum, inst) => sum + inst.amount, 0);
                remainingAmount = debt.amount - paidAmount;
            }

            const value = remainingAmount * price;
            newTotalDebt += value;
            return { ...debt, unitPrice: price, currentValue: value, remainingAmount };
        }));

        setAssets(updatedAssets);
        setDebts(updatedDebts);
        setTotalWealth(newTotalWealth);
        setTotalDebt(newTotalDebt);
        setRefreshing(false);
    };

    const handleDelete = async () => {
        if (!deleteId || !deleteType) return;
        try {
            const collectionName = deleteType === "asset" ? "assets" : "debts";
            await deleteDoc(doc(db, collectionName, deleteId));
            setDeleteId(null);
            setDeleteType(null);
        } catch (error) {
            console.error("Error deleting item:", error);
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
            case "tl": return <FaWallet />;
            case "gold": return <FaCoins />;
            case "stock": return <FaChartLine />;
            case "crypto": return <FaBitcoin />;
            case "bes": return <FaPiggyBank />;
            case "real_estate": return <FaBuilding />;
            // Debt icons
            case "credit_card": return <FaCreditCard />;
            case "loan": return <FaMoneyBillWave />;
            case "person": return <FaUserFriends />;
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
            // Debt labels
            case "credit_card": return "Kredi Kartı";
            case "loan": return "Kredi";
            case "person": return "Kişisel Borç";
            default: return "Diğer";
        }
    };

    const getCardStyle = (type: string, isDebt = false) => {
        if (isDebt) {
            return "from-red-500/10 to-red-500/5 border-red-500/20 text-red-600 dark:text-red-400";
        }
        switch (type) {
            case "tl": return "from-green-500/10 to-green-500/5 border-green-500/20 text-green-600 dark:text-green-400";
            case "gold": return "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
            case "stock": return "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400";
            case "crypto": return "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400";
            case "bes": return "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400";
            case "real_estate": return "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400";
            default: return "from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-600 dark:text-gray-400";
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Portföyüm</h1>
                <div className="flex items-center gap-3">
                    <Link
                        href="/portfolio/new"
                        className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                        <FaPlus />
                        <span className="hidden sm:inline">Varlık Ekle</span>
                    </Link>
                    <Link
                        href="/portfolio/new-debt"
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                        <FaPlus />
                        <span className="hidden sm:inline">Borç Ekle</span>
                    </Link>
                </div>
            </div>

            {/* Financial Goal Card */}
            <div className="mb-8">
                <FinancialGoalCard totalWealth={totalWealth} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Assets */}
                <div className="space-y-6">
                    {/* Total Wealth Card */}
                    <div className="glass p-8 rounded-2xl border-l-4 border-accent-primary relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute right-0 top-0 p-8 opacity-5">
                            <FaWallet size={100} />
                        </div>
                        <p className="text-text-secondary font-medium mb-2">Toplam Varlık Değeri</p>
                        <div className="flex items-end gap-4">
                            <h2 className="text-3xl font-bold">{formatCurrency(totalWealth)}</h2>
                            <button
                                onClick={() => updatePrices(rawAssets, rawDebts)}
                                disabled={refreshing}
                                className="text-xs text-accent-primary hover:underline mb-2 disabled:opacity-50"
                            >
                                {refreshing ? "..." : "Güncelle"}
                            </button>
                        </div>
                    </div>

                    {/* Assets List */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-4">Varlıklar</h2>
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
                                                            {asset.type === "real_estate" || asset.type === "tl"
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
                                                        onClick={() => {
                                                            setDeleteId(asset.id);
                                                            setDeleteType("asset");
                                                        }}
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
                    </div>
                </div>

                {/* Right Column: Debts */}
                <div className="space-y-6">
                    {/* Total Debt Card */}
                    <div className="glass p-8 rounded-2xl border-l-4 border-red-500 relative overflow-hidden flex flex-col justify-center h-[140px]">
                        <div className="absolute right-0 top-0 p-8 opacity-5">
                            <FaCreditCard size={100} />
                        </div>
                        <p className="text-text-secondary font-medium mb-2">Toplam Borç</p>
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDebt)}</h2>
                    </div>

                    {/* Debts List */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-4">Borçlar</h2>
                        <div className="space-y-4">
                            {debts.length > 0 ? (
                                debts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className={clsx(
                                            "relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg group overflow-hidden bg-gradient-to-br",
                                            getCardStyle(debt.type, true)
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
                                                        {debt.isInstallment && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                                                    Taksitli
                                                                </span>
                                                            </>
                                                        )}
                                                        {debt.assetType && debt.assetType !== "tl" && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span>
                                                                    {debt.amount} {debt.currencyCode === "GA" ? "Gr" : debt.currencyCode}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {debt.dueDate && !debt.isInstallment && (
                                                        <p className="text-xs mt-1 opacity-70">
                                                            Son Ödeme: {new Date(debt.dueDate.seconds * 1000).toLocaleDateString("tr-TR")}
                                                        </p>
                                                    )}
                                                    {debt.isInstallment && debt.installments && debt.installments.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-white/10">
                                                            {/* Total and Remaining Debt */}
                                                            <div className="mb-2 space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="opacity-70">Toplam Borç:</span>
                                                                    <span className="font-medium">{formatCurrency(debt.amount)}</span>
                                                                </div>
                                                                {debt.remainingAmount !== undefined && debt.remainingAmount !== debt.amount && (
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="opacity-70">Kalan Borç:</span>
                                                                        <span className="font-bold text-red-600 dark:text-red-400">
                                                                            {formatCurrency(debt.remainingAmount)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {/* Debt Completed Badge */}
                                                                {debt.remainingAmount === 0 && (
                                                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span className="text-xs font-semibold">Borç Tamamlandı! 🎉</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <p className="text-xs font-medium mb-1 opacity-90">Taksit Detayları:</p>
                                                            <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs pr-2 scrollbar-thin">
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
                                                                            <span>{idx + 1}. Taksit:</span>
                                                                            <span className="font-medium">
                                                                                {formatCurrency(inst.amount)} - {new Date(inst.date.seconds * 1000).toLocaleDateString("tr-TR")}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end">
                                                <p className="font-bold text-lg text-text-primary">{formatCurrency(debt.currentValue || debt.amount)}</p>

                                                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    <button
                                                        onClick={() => {
                                                            setDeleteId(debt.id);
                                                            setDeleteType("debt");
                                                        }}
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
                                    <FaCreditCard className="mx-auto text-4xl mb-4 opacity-50" />
                                    <p>Henüz bir borç eklemediniz.</p>
                                    <Link href="/portfolio/new-debt" className="text-red-500 hover:underline mt-2 inline-block">
                                        İlk borcunu ekle
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => {
                    setDeleteId(null);
                    setDeleteType(null);
                }}
                onConfirm={handleDelete}
                title={deleteType === "asset" ? "Varlığı Sil" : "Borcu Sil"}
                message={`Bu ${deleteType === "asset" ? "varlığı" : "borcu"} portföyünüzden silmek istediğinize emin misiniz?`}
                variant="danger"
            />
        </div>
    );
}
