import { Metadata } from 'next';

// Turkish Site Configuration
export const siteConfigTR = {
    name: 'Butcele',
    title: 'Butcele - Ücretsiz Bütçe Yönetimi, Harcama ve Borç Takibi',
    description: 'Bütçenizi yönetin, harcamalarınızı takip edin, borçlarınızı kontrol altına alın. Türkiye\'nin en kapsamlı ücretsiz kişisel finans ve para yönetimi uygulaması. Gelir-gider takibi, borç yönetimi, varlık portföyü.',
    url: 'https://butcele.com',
    ogImage: 'https://butcele.com/og-image.jpg',
    keywords: [
        'bütçe yönetimi',
        'bütçemi yönet',
        'harcama takibi',
        'gelir gider takibi',
        'borç yönetimi',
        'borç takibi',
        'kişisel finans',
        'para yönetimi',
        'tasarruf uygulaması',
        'finansal planlama',
        'online bütçe',
        'harcama kayıt',
        'gelir gider uygulaması',
        'varlık takibi',
        'emeklilik planlaması',
        'finansal özgürlük',
        'kredi takibi',
        'taksit takibi',
        'portföy yönetimi',
        'altın takibi',
        'kripto para takibi',
        'ücretsiz bütçe uygulaması',
        'harcama analizi',
        'gelir yönetimi',
        'borç öde',
        'finansal rapor',
        'bütçe planlama',
        'masraf takibi',
        'gider yönetimi',
        'nakit akışı'
    ],
    authors: [{ name: 'Butcele' }],
    creator: 'Butcele',
    publisher: 'Butcele',
    locale: 'tr_TR',
    type: 'website',
};

// English Site Configuration
export const siteConfigEN = {
    name: 'Butcele',
    title: 'Butcele - Free Budget Management, Expense & Debt Tracking',
    description: 'Manage your budget, track expenses, control debts. The most comprehensive free personal finance and money management app. Income-expense tracking, debt management, asset portfolio.',
    url: 'https://butcele.com/en',
    ogImage: 'https://butcele.com/og-image-en.jpg',
    keywords: [
        'budget management',
        'expense tracking',
        'debt management',
        'personal finance app',
        'money management',
        'savings tracker',
        'financial planning',
        'income expense tracker',
        'budget planner',
        'debt tracker',
        'portfolio management',
        'financial freedom',
        'free budget app',
        'expense analyzer',
        'income management',
        'debt payoff',
        'financial report',
        'budget planning',
        'spending tracker',
        'cash flow management'
    ],
    authors: [{ name: 'Butcele' }],
    creator: 'Butcele',
    publisher: 'Butcele',
    locale: 'en_US',
    type: 'website',
};

export const defaultMetadata: Metadata = {
    metadataBase: new URL(siteConfigTR.url),
    title: {
        default: siteConfigTR.title,
        template: `%s | ${siteConfigTR.name}`,
    },
    description: siteConfigTR.description,
    keywords: siteConfigTR.keywords,
    authors: siteConfigTR.authors,
    creator: siteConfigTR.creator,
    publisher: siteConfigTR.publisher,
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: siteConfigTR.locale,
        url: siteConfigTR.url,
        title: siteConfigTR.title,
        description: siteConfigTR.description,
        siteName: siteConfigTR.name,
        images: [
            {
                url: siteConfigTR.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfigTR.name,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfigTR.title,
        description: siteConfigTR.description,
        images: [siteConfigTR.ogImage],
        creator: '@butcele',
    },
    alternates: {
        canonical: siteConfigTR.url,
        languages: {
            'tr': siteConfigTR.url,
            'en-US': siteConfigEN.url,
        },
    },
    verification: {
        google: 'google-site-verification-code', // Will be added after Google Search Console setup
    },
};

// Structured Data for Organization
export const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfigTR.name,
    url: siteConfigTR.url,
    logo: `${siteConfigTR.url}/logo.png`,
    description: siteConfigTR.description,
    address: {
        '@type': 'PostalAddress',
        addressCountry: 'TR',
    },
    sameAs: [
        // Add social media links when available
    ],
};

// Enhanced WebApplication Schema
export const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfigTR.name,
    url: siteConfigTR.url,
    description: siteConfigTR.description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
    },
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '500',
    },
    featureList: [
        'Gelir Gider Takibi',
        'Harcama Kategorileri',
        'Borç Yönetimi',
        'Taksit Takibi',
        'Varlık Portföyü',
        'Altın ve Döviz Takibi',
        'Kripto Para Takibi',
        'Finansal Raporlar',
        'Bütçe Planlama',
        'Tasarruf Hedefleri',
        'Aylık Özet ve Analiz',
        'Akıllı Finansal Öneriler',
    ],
};

// FAQ Schema for SEO
export const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Butcele nedir?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Butcele, gelir-gider takibi, borç yönetimi ve varlık takibi yapabileceğiniz ücretsiz bir kişisel finans uygulamasıdır. Harcamalarınızı kategorilere ayırabilir, borçlarınızı takip edebilir ve finansal durumunuzu analiz edebilirsiniz.',
            },
        },
        {
            '@type': 'Question',
            name: 'Butcele ücretsiz mi?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Evet, Butcele tamamen ücretsizdir. Tüm özellikler sınırsız kullanıma açıktır. Reklam veya gizli ücret yoktur.',
            },
        },
        {
            '@type': 'Question',
            name: 'Harcamalarımı nasıl takip edebilirim?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Harcamalar sayfasından yeni harcama ekleyebilir, kategorilere ayırabilir ve aylık raporlarınızı görüntüleyebilirsiniz. Ayrıca banka ekstresinden toplu harcama yükleyebilirsiniz.',
            },
        },
        {
            '@type': 'Question',
            name: 'Borçlarımı nasıl yönetebilirim?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Portföy sayfasından kredi kartı borçlarınızı, kredilerinizi ve kişisel borçlarınızı ekleyebilirsiniz. Taksitli borçlar için ödeme planı oluşturabilir ve her taksiti ayrı ayrı işaretleyebilirsiniz.',
            },
        },
        {
            '@type': 'Question',
            name: 'Verilerim güvende mi?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Evet, tüm verileriniz Firebase güvenlik altyapısı ile korunmaktadır. Verileriniz şifrelenir ve sadece sizin erişiminize açıktır.',
            },
        },
    ],
};
