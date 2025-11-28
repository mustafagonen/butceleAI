"use client";

import Button from "@/components/Button";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaArrowRight, FaChartPie, FaWallet } from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-8">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary opacity-75 blur-2xl animate-pulse" />
        <div className="relative bg-bg-card p-6 rounded-full border border-white/10">
          <FaWallet className="text-6xl text-accent-primary" />
        </div>
      </div>

      <div className="space-y-4 max-w-2xl">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-accent-primary to-accent-secondary pb-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: t("landing.hero.title") }}
        />
        <p className="text-xl text-text-secondary">
          {t("landing.hero.subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/login">
          <Button size="lg" className="gap-2 h-14">
            {t("landing.hero.startBtn")} <FaArrowRight />
          </Button>
        </Link>
        <Link href="#features">
          <Button variant="outline" size="lg" className="gap-2 h-14">
            {t("landing.hero.featuresBtn")} <FaChartPie />
          </Button>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-16 w-full">
        {[
          {
            title: t("landing.features.analysis.title"),
            desc: t("landing.features.analysis.desc"),
            icon: "📊",
          },
          {
            title: t("landing.features.theme.title"),
            desc: t("landing.features.theme.desc"),
            icon: "🎨",
          },
          {
            title: t("landing.features.portfolio.title"),
            desc: t("landing.features.portfolio.desc"),
            icon: "📈",
          },
          {
            title: t("landing.features.debt.title"),
            desc: t("landing.features.debt.desc"),
            icon: "💳",
          },
          {
            title: t("landing.features.assets.title"),
            desc: t("landing.features.assets.desc"),
            icon: "💎",
          },
          {
            title: t("landing.features.expenses.title"),
            desc: t("landing.features.expenses.desc"),
            icon: "💸",
          },
          {
            title: t("landing.features.ai.title"),
            desc: t("landing.features.ai.desc"),
            icon: "🤖",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass p-6 rounded-2xl text-left hover:scale-105 transition-transform duration-300"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">{feature.title}</h3>
            <p className="text-text-secondary">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
