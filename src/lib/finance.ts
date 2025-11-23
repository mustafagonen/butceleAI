export interface AssetPrice {
    code: string;
    price: number;
    lastUpdated: Date;
}

// Mock data for fallback or initial development
// In a real production app, these would be server-side calls to avoid CORS or API key exposure
// For this demo, we will try to use some public endpoints or fallbacks

export async function getGoldPrice(): Promise<number> {
    try {
        // Fetch from our own API route to avoid CORS issues
        const response = await fetch("/api/gold-price");
        const data = await response.json();

        if (data && data.price) {
            return data.price;
        }
        throw new Error("Invalid API response");
    } catch (error) {
        console.warn("Failed to fetch gold price, using fallback:", error);
        return 5550.00; // Fallback price (Nov 2025)
    }
}

export async function getCryptoPrice(symbol: string): Promise<number> {
    try {
        // CoinGecko API (Free tier)
        const id = symbol.toLowerCase() === "btc" ? "bitcoin" :
            symbol.toLowerCase() === "eth" ? "ethereum" : symbol.toLowerCase();

        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=try`);
        const data = await response.json();

        if (data && data[id] && data[id].try) {
            return data[id].try;
        }
        throw new Error("Symbol not found");
    } catch (error) {
        console.warn(`Failed to fetch crypto price for ${symbol}, using fallback:`, error);
        if (symbol.toLowerCase() === "btc") return 3200000;
        if (symbol.toLowerCase() === "eth") return 110000;
        return 0;
    }
}

export async function getStockPrice(ticker: string): Promise<number> {
    // Fetching stock prices client-side is hard due to CORS and paid APIs.
    // We will simulate this or use a very simple fallback for now.
    // In a real app, this should be a Next.js API route that queries Yahoo Finance.

    // Simulating a random fluctuation around a base price for demo purposes
    // since we don't have a reliable free CORS-friendly stock API for BIST
    const basePrices: Record<string, number> = {
        "TTRAK": 950.00,
        "THYAO": 280.00,
        "ASELS": 60.00,
        "GARAN": 85.00,
        "EREGL": 45.00
    };

    const base = basePrices[ticker.toUpperCase()] || 100.00;
    const randomChange = (Math.random() - 0.5) * 2; // +/- 1 TL
    return base + randomChange;
}

export async function getBesPrice(fundCode: string): Promise<number> {
    // TEFAS data is also hard to get client-side.
    // Simulating for now.
    return 1.5 + Math.random() * 0.1;
}
