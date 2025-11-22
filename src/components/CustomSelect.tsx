"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";
import clsx from "clsx";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    icon?: ReactNode;
    className?: string;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Seçiniz",
    icon,
    className
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

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

    return (
        <div className={clsx("relative min-w-[160px]", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 border outline-none",
                    isOpen
                        ? "bg-white dark:bg-white/10 border-accent-primary ring-1 ring-accent-primary shadow-lg shadow-accent-primary/10"
                        : "bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10 hover:border-accent-primary/50 hover:bg-white/80 dark:hover:bg-white/5"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-accent-primary">{icon}</span>}
                    <span className={clsx("truncate", !value && "text-text-secondary")}>
                        {selectedLabel}
                    </span>
                </div>
                <FaChevronDown className={clsx("text-xs text-text-secondary transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setIsOpen(false);
                            }}
                            className={clsx(
                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                value === ""
                                    ? "bg-accent-primary/10 text-accent-primary font-medium"
                                    : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text-primary"
                            )}
                        >
                            {placeholder}
                        </button>
                        {options.map((option) => (
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
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
