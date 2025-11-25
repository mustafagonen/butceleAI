"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface AnalysisChartsProps {
    expenseCategories: Record<string, number>;
    monthlyTrends: { month: string; income: number; expense: number }[];
}

const COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7", "#EC4899"];

export default function AnalysisCharts({ expenseCategories, monthlyTrends }: AnalysisChartsProps) {
    const { theme, privacyMode } = useTheme();

    const pieData = Object.entries(expenseCategories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-white/10 shadow-xl text-sm">
                    <p className="font-bold mb-1">{label || payload[0].name}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {privacyMode ? "****" : formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Harcama Dağılımı</h3>
                <div className="h-[300px] w-full">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    style={{ outline: 'none' }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-text-secondary">
                            Veri yok
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Aylık Trend (Son 6 Ay)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => privacyMode ? "****" : `₺${value / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Legend />
                            <Bar dataKey="income" name="Gelir" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
