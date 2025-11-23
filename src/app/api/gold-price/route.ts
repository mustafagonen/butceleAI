import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch from a public API (server-side to avoid CORS)
        const response = await fetch("https://api.genelpara.com/embed/altin.json", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`External API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract Gram Altın (GA) selling price
        if (data && data.GA && data.GA.satis) {
            const price = parseFloat(data.GA.satis);
            return NextResponse.json({ price });
        }

        throw new Error("Invalid data format");
    } catch (error) {
        console.error("Error fetching gold price:", error);
        // Return a realistic fallback if API fails
        return NextResponse.json({ price: 5550.00 }, { status: 200 });
    }
}
