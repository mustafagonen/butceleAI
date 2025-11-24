"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaTrophy, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import CurrencyInput from "./CurrencyInput";
import { formatCurrency } from "@/lib/utils";
import clsx from "clsx";

interface FinancialGoalCardProps {
    totalWealth: number;
}

export default function FinancialGoalCard({ totalWealth }: FinancialGoalCardProps) {
    const { user } = useAuth();
    const [goal, setGoal] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoal = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().financialGoal) {
                    setGoal(docSnap.data().financialGoal);
                }
            } catch (error) {
                console.error("Error fetching goal:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoal();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        const newGoal = parseFloat(tempGoal);
        if (isNaN(newGoal) || newGoal <= 0) return;

        try {
            const docRef = doc(db, "users", user.uid);
            // Use setDoc with merge: true to ensure we don't overwrite other user data if the doc doesn't exist or has other fields
            await setDoc(docRef, { financialGoal: newGoal }, { merge: true });
            setGoal(newGoal);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving goal:", error);
        }
    };

    const getProgress = () => {
        if (!goal || goal === 0) return 0;
        const progress = (totalWealth / goal) * 100;
        return Math.min(progress, 100);
    };



    if (loading) return null; // Or a skeleton

    if (goal === null && !isEditing) {
        return (
            <div className="glass p-6 rounded-2xl flex items-center justify-between border border-dashed border-gray-300 dark:border-white/10 hover:border-accent-primary transition-colors cursor-pointer group" onClick={() => setIsEditing(true)}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 group-hover:text-accent-primary transition-colors">
                        <FaTrophy size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">Finansal Özgürlük Hedefi Belirle</h3>
                        <p className="text-sm text-text-secondary">Kendine bir hedef koy ve ilerlemeni takip et.</p>
                    </div>
                </div>
                <FaEdit className="text-gray-400 group-hover:text-accent-primary transition-colors" />
            </div>
        );
    }

    const progress = getProgress();

    return (
        <div className="glass p-6 rounded-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <FaTrophy size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FaTrophy className="text-yellow-500" />
                        Finansal Özgürlük Hedefi
                    </h3>
                    {!isEditing && (
                        <button onClick={() => { setTempGoal(goal?.toString() || ""); setIsEditing(true); }} className="text-text-secondary hover:text-accent-primary transition-colors">
                            <FaEdit />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1">
                            <CurrencyInput
                                value={tempGoal}
                                onChange={setTempGoal}
                                placeholder="Hedef Tutar (TL)"
                                autoFocus
                            />
                        </div>
                        <button onClick={handleSave} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-colors">
                            <FaCheck />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold text-text-primary">{formatCurrency(totalWealth)}</span>
                            <span className="text-sm text-text-secondary mb-1">/ {formatCurrency(goal || 0)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
