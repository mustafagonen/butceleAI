"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    autoFocus?: boolean;
}

export default function CurrencyInput({
    value,
    onChange,
    placeholder = "0,00",
    className,
    required = false,
    autoFocus = false,
}: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
        if (value) {
            // Convert number or string to formatted string for display
            // If it's a raw number like 1000.5, format it to 1.000,50
            const numVal = typeof value === "string" ? parseFloat(value) : value;
            if (!isNaN(numVal)) {
                setDisplayValue(
                    new Intl.NumberFormat("tr-TR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                    }).format(numVal)
                );
            }
        } else {
            setDisplayValue("");
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow only numbers and comma
        if (!/^[0-9,.]*$/.test(inputValue)) return;

        // Remove dots (thousands separators) for processing
        const rawValue = inputValue.replace(/\./g, "");

        // Replace comma with dot for standard number parsing
        const standardValue = rawValue.replace(",", ".");

        if (standardValue === "" || isNaN(Number(standardValue))) {
            onChange("");
            setDisplayValue(inputValue); // Let user type freely
            return;
        }

        onChange(standardValue);
        setDisplayValue(inputValue);
    };

    const handleBlur = () => {
        if (value) {
            const numVal = typeof value === "string" ? parseFloat(value) : value;
            if (!isNaN(numVal)) {
                setDisplayValue(
                    new Intl.NumberFormat("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(numVal)
                );
            }
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                className={clsx(
                    "w-full bg-gray-50 dark:bg-bg-primary border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all",
                    className
                )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                TL
            </span>
        </div>
    );
}
