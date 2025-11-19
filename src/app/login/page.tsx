"use client";

import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { FaGoogle, FaWallet } from "react-icons/fa";

export default function LoginPage() {
    const { loginWithGoogle } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
            <div className="text-center space-y-4">
                <div className="inline-block p-4 rounded-full bg-bg-secondary mb-4">
                    <FaWallet className="text-5xl text-accent-primary" />
                </div>
                <h1 className="text-3xl font-bold">Hoş Geldiniz</h1>
                <p className="text-text-secondary max-w-md">
                    Butcele ile harcamalarınızı yönetmek için giriş yapın veya kayıt olun.
                </p>
            </div>

            <div className="w-full max-w-sm p-8 rounded-2xl glass border border-white/10 space-y-6">
                <Button
                    onClick={loginWithGoogle}
                    className="w-full gap-3 py-4 text-lg"
                    variant="primary"
                >
                    <FaGoogle />
                    Google ile Devam Et
                </Button>

                <div className="text-center text-sm text-text-secondary">
                    Devam ederek Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
                </div>
            </div>
        </div>
    );
}
