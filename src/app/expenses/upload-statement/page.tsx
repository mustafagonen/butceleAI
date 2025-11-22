"use client";

import { useState, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { FaCloudUploadAlt, FaCheck, FaTimes, FaArrowLeft, FaEdit, FaTrash, FaSave } from "react-icons/fa";
import { parseStatement, GroupedExpense, ParsedTransaction } from "@/actions/statement-actions";
import { formatCurrency } from "@/lib/utils";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import CustomSelect from "@/components/CustomSelect";



export default function UploadStatementPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpense[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [editingTransaction, setEditingTransaction] = useState<{ groupIndex: number; transactionIndex: number } | null>(null);
    const [editForm, setEditForm] = useState<ParsedTransaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<{ groupIndex: number; transactionIndex: number } | null>(null);

    const [statementTotal, setStatementTotal] = useState<number | undefined>(undefined);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleParse = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setStatementTotal(undefined);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await parseStatement(formData);
            if (result.success) {
                setGroupedExpenses(result.data);
                setStatementTotal(result.statementTotal);
            } else {
                setError(result.error || "Ayrıştırma başarısız.");
            }
        } catch (err) {
            setError("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };



    const handleEditClick = (groupIndex: number, transactionIndex: number, transaction: ParsedTransaction) => {
        setEditingTransaction({ groupIndex, transactionIndex });
        setEditForm({ ...transaction });
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
        setEditForm(null);
    };

    const handleUpdateTransaction = () => {
        if (!editingTransaction || !editForm) return;

        const { groupIndex, transactionIndex } = editingTransaction;
        const oldGroup = groupedExpenses[groupIndex];
        const oldTransaction = oldGroup.transactions[transactionIndex];

        // Create a copy of grouped expenses
        let newGroupedExpenses = [...groupedExpenses];

        // Check if category changed
        if (editForm.category !== oldTransaction.category) {
            // Remove from old group
            newGroupedExpenses[groupIndex] = {
                ...oldGroup,
                totalAmount: oldGroup.totalAmount - oldTransaction.amount,
                count: oldGroup.count - 1,
                transactions: oldGroup.transactions.filter((_, idx) => idx !== transactionIndex)
            };

            // If old group is empty, remove it
            if (newGroupedExpenses[groupIndex].transactions.length === 0) {
                newGroupedExpenses = newGroupedExpenses.filter((_, idx) => idx !== groupIndex);
            }

            // Add to new group
            const newGroupIndex = newGroupedExpenses.findIndex(g => g.category === editForm.category);
            if (newGroupIndex !== -1) {
                // Add to existing group
                const targetGroup = newGroupedExpenses[newGroupIndex];
                newGroupedExpenses[newGroupIndex] = {
                    ...targetGroup,
                    totalAmount: targetGroup.totalAmount + editForm.amount,
                    count: targetGroup.count + 1,
                    transactions: [...targetGroup.transactions, editForm]
                };
            } else {
                // Create new group
                newGroupedExpenses.push({
                    category: editForm.category,
                    totalAmount: editForm.amount,
                    count: 1,
                    transactions: [editForm]
                });
            }
        } else {
            // Category didn't change, just update in place
            const updatedTransactions = [...oldGroup.transactions];
            updatedTransactions[transactionIndex] = editForm;

            // Recalculate total amount for the group
            const newTotalAmount = updatedTransactions.reduce((sum, t) => sum + t.amount, 0);

            newGroupedExpenses[groupIndex] = {
                ...oldGroup,
                totalAmount: newTotalAmount,
                transactions: updatedTransactions
            };
        }

        setGroupedExpenses(newGroupedExpenses);
        handleCancelEdit();
    };

    const handleDeleteClick = (groupIndex: number, transactionIndex: number) => {
        setDeletingTransaction({ groupIndex, transactionIndex });
    };

    const handleConfirmDelete = () => {
        if (!deletingTransaction) return;

        const { groupIndex, transactionIndex } = deletingTransaction;
        const group = groupedExpenses[groupIndex];
        const transaction = group.transactions[transactionIndex];

        let newGroupedExpenses = [...groupedExpenses];

        // Remove transaction from group
        const updatedTransactions = group.transactions.filter((_, idx) => idx !== transactionIndex);

        if (updatedTransactions.length === 0) {
            // Remove group if empty
            newGroupedExpenses = newGroupedExpenses.filter((_, idx) => idx !== groupIndex);
        } else {
            // Update group
            newGroupedExpenses[groupIndex] = {
                ...group,
                totalAmount: group.totalAmount - transaction.amount,
                count: group.count - 1,
                transactions: updatedTransactions
            };
        }

        setGroupedExpenses(newGroupedExpenses);
        setDeletingTransaction(null);
    };

    const handleSave = async () => {
        if (!user || groupedExpenses.length === 0) return;

        setLoading(true);
        try {
            const promises = groupedExpenses.map(async (group) => {
                await addDoc(collection(db, "transactions"), {
                    userId: user.uid,
                    type: "expense",
                    amount: group.totalAmount,
                    category: group.category,
                    description: `${group.count} adet işlemden oluşturuldu (Ekstre)`,
                    date: serverTimestamp(),
                    paymentMethod: "Kredi Kartı",
                });
            });

            await Promise.all(promises);
            setSuccess(true);
            setTimeout(() => {
                router.push("/expenses");
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("Kaydetme sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const parsedTotal = groupedExpenses.reduce((sum, g) => sum + g.totalAmount, 0);
    const isTotalMismatch = statementTotal !== undefined && Math.abs(parsedTotal - statementTotal) > 1;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/expenses">
                    <Button variant="ghost" className="p-2 rounded-full">
                        <FaArrowLeft />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Ekstre Yükle</h1>
            </div>

            <div className="glass p-8 rounded-2xl text-center space-y-6">
                {!groupedExpenses.length && !success ? (
                    <>
                        <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-colors hover:border-accent-primary/50">
                            <FaCloudUploadAlt className="text-6xl text-text-secondary" />
                            <div className="space-y-2">
                                <p className="text-lg font-medium">PDF Ekstrenizi buraya sürükleyin veya seçin</p>
                                <p className="text-sm text-text-secondary">Sadece PDF dosyaları desteklenir</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button as="span" variant="secondary" className="cursor-pointer">
                                    Dosya Seç
                                </Button>
                            </label>
                            {file && <p className="text-accent-primary font-medium">{file.name}</p>}
                        </div>

                        <Button
                            onClick={handleParse}
                            disabled={!file || loading}
                            className="w-full py-4 text-lg"
                        >
                            {loading ? "İşleniyor..." : "Ekstreyi Analiz Et"}
                        </Button>
                    </>
                ) : success ? (
                    <div className="py-20 flex flex-col items-center gap-4 text-green-500">
                        <FaCheck className="text-6xl" />
                        <h2 className="text-2xl font-bold">Başarıyla Kaydedildi!</h2>
                        <p className="text-text-secondary">Harcamalar sayfasına yönlendiriliyorsunuz...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Bulunan Harcama Grupları</h2>
                            <Button variant="ghost" onClick={() => setGroupedExpenses([])} className="text-red-500">
                                İptal Et
                            </Button>
                        </div>

                        {statementTotal !== undefined && (
                            <div className={`p-4 rounded-xl border ${isTotalMismatch ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400' : 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="text-sm font-medium opacity-80">Ekstrede Bulunan Toplam</div>
                                        <div className="text-xl font-bold">{formatCurrency(statementTotal)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium opacity-80">Ayrıştırılan Toplam</div>
                                        <div className="text-xl font-bold">{formatCurrency(parsedTotal)}</div>
                                    </div>
                                </div>
                                {isTotalMismatch && (
                                    <div className="mt-2 text-sm font-medium">
                                        ⚠️ Toplam tutarlar uyuşmuyor. Lütfen harcamaları kontrol edin.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {groupedExpenses.map((expense, index) => (
                                <div key={index} className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        onClick={() => {
                                            const element = document.getElementById(`details-${index}`);
                                            if (element) {
                                                element.classList.toggle('hidden');
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                📦
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {expense.category}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-zinc-400">
                                                    {expense.count} işlem bulundu
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-red-500">
                                                {formatCurrency(expense.totalAmount)}
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-zinc-500">
                                                Detaylar için tıklayın
                                            </div>
                                        </div>
                                    </div>

                                    <div id={`details-${index}`} className="hidden border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                                        <div className="p-4 space-y-2">
                                            {expense.transactions
                                                .map((t, tIndex) => {
                                                    const isEditing = editingTransaction?.groupIndex === index && editingTransaction?.transactionIndex === tIndex;
                                                    const isDeleting = deletingTransaction?.groupIndex === index && deletingTransaction?.transactionIndex === tIndex;

                                                    if (isEditing && editForm) {
                                                        return (
                                                            <div key={tIndex} className="p-4 bg-white dark:bg-black/20 rounded-lg space-y-3 border border-accent-primary/30">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.date}
                                                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                                                        placeholder="Tarih"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={editForm.amount}
                                                                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                                                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                                                        placeholder="Tutar"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.description}
                                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                                                    placeholder="Açıklama"
                                                                />
                                                                <CustomSelect
                                                                    value={editForm.category}
                                                                    onChange={(val) => setEditForm({ ...editForm, category: val })}
                                                                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                                                    placeholder="Kategori Seç"
                                                                />
                                                                <div className="flex justify-end gap-2 pt-2">
                                                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                                                        İptal
                                                                    </Button>
                                                                    <Button size="sm" onClick={handleUpdateTransaction} className="gap-2">
                                                                        <FaSave /> Kaydet
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={tIndex} className="flex items-center justify-between text-sm py-2 border-b border-gray-200 dark:border-zinc-800/50 last:border-0 group">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className="text-gray-500 dark:text-zinc-500 w-24 font-mono text-xs shrink-0">{t.date}</div>
                                                                <div className="text-gray-700 dark:text-zinc-300 truncate mr-2">{t.description}</div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-red-500 dark:text-red-400 font-medium whitespace-nowrap">
                                                                    {formatCurrency(t.amount)}
                                                                </div>

                                                                {isDeleting ? (
                                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                                                                        <span className="text-xs text-red-500 font-medium">Silinsin mi?</span>
                                                                        <button
                                                                            onClick={handleConfirmDelete}
                                                                            className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                                                        >
                                                                            <FaCheck size={12} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeletingTransaction(null)}
                                                                            className="p-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                                                                        >
                                                                            <FaTimes size={12} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditClick(index, tIndex, t);
                                                                            }}
                                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                                            title="Düzenle"
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteClick(index, tIndex);
                                                                            }}
                                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                            title="Sil"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={loading} className="px-8 py-3 text-lg gap-2">
                                <FaCheck /> Onayla ve Kaydet
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
