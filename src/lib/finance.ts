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
        // Using a public free API for Gold prices in TR (example)
        // If this fails, we return a fallback
        const response = await fetch("https://api.genelpara.com/embed/altin.json");
        const data = await response.json();
        // Assuming data structure, usually GA (Gram Altın) is the key
        // This is a best-effort guess at a free API structure
        if (data && data.GA && data.GA.satis) {
            return parseFloat(data.GA.satis);
        }
        throw new Error("Invalid data format");
    } catch (error) {
        console.warn("Failed to fetch gold price, using fallback:", error);
        return 2950.00; // Fallback price
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
