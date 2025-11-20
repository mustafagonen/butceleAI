"use client";

import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 mt-20 pb-24 md:pb-8">
                {children}
            </main>
            {user && <BottomNav />}
        </div>
    );
}
