import React from "react";
import clsx from "clsx";

interface LoaderProps {
    fullScreen?: boolean;
    className?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, className }) => {
    const content = (
        <div className={clsx("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>

                {/* Inner Coin */}
                <div className="w-10 h-10 bg-accent-secondary/20 rounded-full flex items-center justify-center border-2 border-accent-secondary animate-pulse-glow">
                    <span className="text-xl font-bold text-accent-secondary">₺</span>
                </div>
            </div>
            <div className="text-sm font-medium text-text-secondary animate-pulse">
                Yükleniyor...
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return (
        <div className="w-full py-12 flex items-center justify-center">
            {content}
        </div>
    );
};

export default Loader;
