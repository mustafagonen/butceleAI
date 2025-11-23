"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import clsx from "clsx";

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Seçiniz",
    className
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Reset search when closed
    useEffect(() => {
        if (!isOpen) {
            setSearch("");
        }
    }, [isOpen]);

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl transition-all duration-200 border outline-none text-left",
                    isOpen
                        ? "bg-white dark:bg-white/10 border-accent-primary ring-1 ring-accent-primary shadow-lg shadow-accent-primary/10"
                        : "bg-gray-50 dark:bg-bg-primary border-gray-300 dark:border-white/10 hover:border-accent-primary/50"
                )}
            >
                <span className={clsx("truncate", !value && "text-text-secondary")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FaChevronDown className={clsx("text-xs text-text-secondary transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 dark:border-white/5">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ara..."
                                className="w-full bg-gray-100 dark:bg-white/5 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-primary"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                        value === option.value
                                            ? "bg-accent-primary/10 text-accent-primary font-medium"
                                            : "text-text-primary hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-center text-sm text-text-secondary">
                                Sonuç bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
