import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.butcele.com.tr';
    const currentDate = new Date();

    // Only include public pages (authenticated pages are blocked in robots.txt)
    const publicRoutes = [
        { url: '', priority: 1.0, changeFrequency: 'daily' as const },
        { url: '/login', priority: 0.6, changeFrequency: 'monthly' as const },
    ];

    const sitemap: MetadataRoute.Sitemap = [];

    publicRoutes.forEach(route => {
        // Turkish version (default)
        sitemap.push({
            url: `${baseUrl}${route.url}`,
            lastModified: currentDate,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            alternates: {
                languages: {
                    tr: `${baseUrl}${route.url}`,
                    en: `${baseUrl}/en${route.url}`,
                },
            },
        });
    });

    return sitemap;
}
