"use server";

import { CATEGORIES } from "@/lib/constants";
import PDFParser from "pdf2json";

export interface ParsedTransaction {
    date: string;
    description: string;
    amount: number;
    category: string;
}

export interface GroupedExpense {
    category: string;
    totalAmount: number;
    count: number;
    transactions: ParsedTransaction[];
}

export type ParseResult =
    | { success: true; data: GroupedExpense[]; statementTotal?: number }
    | { success: false; error: string };

// Helper to map description to category
function mapDescriptionToCategory(description: string): string {
    const desc = description.toLowerCase();

    // Simple keyword matching - can be expanded
    if (desc.includes("migros") || desc.includes("carrefour") || desc.includes("bim") || desc.includes("a101") || desc.includes("sok") || desc.includes("market")) return "Market";
    if (desc.includes("restoran") || desc.includes("cafe") || desc.includes("starbucks") || desc.includes("yemek")) return "Yeme-İçme";
    if (desc.includes("uber") || desc.includes("taksi") || desc.includes("marti") || desc.includes("otobus") || desc.includes("metro")) return "Ulaşım";
    if (desc.includes("kira")) return "Kira";
    if (desc.includes("fatura") || desc.includes("turkcell") || desc.includes("vodafone") || desc.includes("enerjisa") || desc.includes("iski")) return "Faturalar";
    if (desc.includes("zara") || desc.includes("h&m") || desc.includes("lcw") || desc.includes("giyim")) return "Giyim";
    if (desc.includes("eczane") || desc.includes("hastane") || desc.includes("doktor")) return "Sağlık";
    if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("youtube") || desc.includes("sinema")) return "Eğlence";
    if (desc.includes("okul") || desc.includes("kurs") || desc.includes("kitap")) return "Eğitim";

    return "Diğer";
}

export async function parseStatement(formData: FormData): Promise<ParseResult> {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("Dosya yüklenemedi.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // pdf2json is event based, so we wrap it in a promise
        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1); // 1 = text content only

            pdfParser.on("pdfParser_dataError", (errData: { parserError: unknown }) => {
                console.error("PDF Parser Error:", errData.parserError);
                reject(new Error("PDF okunamadı: " + errData.parserError));
            });

            pdfParser.on("pdfParser_dataReady", (_pdfData: unknown) => {
                // pdf2json returns URL-encoded text, we need to decode it
                // The raw text content is usually in pdfParser.getRawTextContent()
                // But since we are in the callback, we can use the instance method if we had access,
                // or parse the pdfData.

                // Using getRawTextContent() is the easiest way if we have the instance.
                // Since we are inside the callback, we can't easily access 'pdfParser' if it's not captured.
                // But 'pdfParser' variable is available in this scope.

                try {
                    const rawText = pdfParser.getRawTextContent();
                    resolve(rawText);
                } catch (e) {
                    reject(e);
                }
            });

            pdfParser.parseBuffer(buffer);
        });

        // Split into lines and process
        const lines = text.split("\n");
        const transactions: ParsedTransaction[] = [];

        // Regex for detecting date (DD.MM.YYYY or DD/MM/YYYY) and Amount
        // This is a generic attempt. Bank statements vary wildly.
        // We look for lines that have a date at the start and an amount at the end.
        // Regex for detecting date (DD.MM.YYYY or DD/MM/YYYY) and Amount
        // We look for lines that have a date at the start and an amount at the end.
        // Removed \s from amount regex to prevent capturing numbers from description (e.g. "STORE 801 830.00")
        const dateRegex = /(\d{2}[./]\d{2}[./]\d{4})/;
        const amountRegex = /([\d.,]+)$/;

        // Look for Statement Total (Dönem Borcu / Ödenecek Tutar)
        let statementTotal = 0;
        // Updated regex to handle colons, spaces, TL suffix, and typos/encoding issues
        // e.g. "Dnem Borcu : 32,990.60 TL", "Genel Toplam", "Ekstre Borcu"
        const totalRegex = /(?:d[öo]?nem\s*borcu|ödenecek\s*tutar|toplam\s*tutar|ekstre\s*borcu|genel\s*toplam).*?([\d.,]+)\s*(?:TL|TRY)?/i;

        for (const line of lines) {
            const match = line.match(totalRegex);
            if (match) {
                let amountStr = match[1].trim().replace(/[^\d.,]/g, "");
                // Use same parsing logic
                const lastDotIndex = amountStr.lastIndexOf(".");
                const lastCommaIndex = amountStr.lastIndexOf(",");
                const lastSeparatorIndex = Math.max(lastDotIndex, lastCommaIndex);

                if (lastSeparatorIndex !== -1) {
                    const decimals = amountStr.length - lastSeparatorIndex - 1;
                    if (decimals === 2) {
                        const separator = amountStr[lastSeparatorIndex];
                        if (separator === ".") {
                            const integerPart = amountStr.substring(0, lastSeparatorIndex).replace(/\D/g, "");
                            const decimalPart = amountStr.substring(lastSeparatorIndex + 1);
                            amountStr = `${integerPart}.${decimalPart}`;
                        } else {
                            const integerPart = amountStr.substring(0, lastSeparatorIndex).replace(/\D/g, "");
                            const decimalPart = amountStr.substring(lastSeparatorIndex + 1);
                            amountStr = `${integerPart}.${decimalPart}`;
                        }
                    } else {
                        amountStr = amountStr.replace(/\D/g, "");
                    }
                }
                const parsed = parseFloat(amountStr);
                if (!isNaN(parsed)) {
                    statementTotal = parsed;
                    break; // Assume first match is correct
                }
            }
        }

        let pendingDate: string | null = null;
        let pendingDescription: string = "";

        // Helper to fix common Turkish character encoding issues in PDF
        const fixTurkishChars = (str: string): string => {
            // First, replace common "replacement characters" or garbage with a standard placeholder if needed,
            // but using wildcards in specific words is more robust.

            return str
                .replace(/Ð/g, "Ğ")
                .replace(/Ý/g, "İ")
                .replace(/Þ/g, "Ş")
                .replace(/ð/g, "ğ")
                .replace(/ý/g, "ı")
                .replace(/þ/g, "ş")
                // Fix specific broken words observed in user data
                // Use .? or .{1,2} to match potential garbage chars (boxes, spaces, etc.)
                .replace(/K.{1,3}k.{1,3}Kaya/g, "Küçük Kaya")
                .replace(/.{1,3}lem/g, "İşlem")
                .replace(/Aıklaması/g, "Açıklaması")
                .replace(/Dnem/g, "Dönem")
                .replace(/.{1,3}deme/g, " Ödeme")
                .replace(/Tesekkr/g, "Teşekkür")
                .replace(/.{1,3}TLEK/g, "ÇİTLEK")
                .replace(/MA.{1,3}AZACILIK/g, "MAĞAZACILIK")
                .replace(/A.{1,3}DA.{1,3}MARKET/g, "ÇAĞDAŞ MARKET")
                .replace(/BAHCELIEVLER/g, "BAHÇELİEVLER")
                .replace(/.{0,3}NSALLAR/g, "ÜNSALLAR")
                .replace(/.{0,3}ZAYDOS/g, "ÖZAYDOS")
                .replace(/VERO.{1,3}LU/g, "VEROĞLU")
                .replace(/MAM.{1,3}LLER/g, "MAMÜLLER")
                .replace(/\sN\s\./g, " İNŞ.") // Safer: space N space dot
                .replace(/N.{1,3}SAN.{1,3}T/g, "İNŞ SAN T")
                .replace(/KO.{1,3}CA.{1,3}KEBAP/g, "KOÇ CAĞ KEBAP")
                .replace(/KUAF.{1,3}R.{1,3}G.{1,3}ROL/g, "KUAFÖR GÜROL")
                .replace(/AH.{1,3}NLERTEK/g, "ŞAHİNLER TEK")
                .replace(/GRAT.{1,3}S/g, "GRATİS")
                .replace(/PASTANES\b/g, "PASTANESİ")
                .replace(/ROSSM\b/g, "ROSSMANN")
                .replace(/GI$/g, "GIDA")
                .replace(/D.{1,3}RK/g, "DİREK")
                .replace(/.{0,3}ANSERA/g, "ANSERA") // Fix garbage prefix
                .replace(/P.{1,3}KN.{1,3}K/g, "PİKNİK")
                .replace(/FAT.{1,3}H/g, "FATİH")
                .replace(/N.{1,3}AAT/g, "İNŞAAT")
                .replace(/GRATİSANKAMALL/g, "GRATİS ANKAMALL")
                .replace(/GUNGORANKAMALL/g, "GUNGOR ANKAMALL")
                .replace(/Al.{1,3}veri/g, "Alışveriş")
                .replace(/\s+/g, " "); // Collapse multiple spaces
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // FIX: Handle run-on lines where a new date starts immediately after an amount
            // e.g. "148.7825/08/" -> "148.78\n25/08/"
            // Look for pattern: (number)(date)
            const runOnMatch = line.match(/([\d,.]+)(\d{2}[./]\d{2}[./])/);
            if (runOnMatch) {
                // If the match index is late in the string (likely after description)
                // Insert a newline before the date
                const splitIndex = line.indexOf(runOnMatch[2], line.indexOf(runOnMatch[1]));
                if (splitIndex !== -1) {
                    const part1 = line.substring(0, splitIndex);
                    const part2 = line.substring(splitIndex);
                    lines[i] = part1;
                    lines.splice(i + 1, 0, part2);
                    line = part1; // Process current line as part1
                }
            }

            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Relaxed date regex to allow 1-digit day/month (e.g. 2/09/2025)
            const dateRegex = /(\d{1,2}[./]\d{1,2}[./]\d{4})/;
            // Amount regex allowing optional TL/TRY suffix and trailing spaces
            const amountRegex = /([\d.,]+)\s*(?:TL|TRY)?\s*$/;

            const dateMatch = trimmedLine.match(dateRegex);
            let amountMatch = trimmedLine.match(amountRegex);

            // CRITICAL FIX: Check if the "amount" is actually just the year part of the date
            // e.g. "25/08/2025" -> dateMatch="25/08/2025", amountMatch="2025"
            if (dateMatch && amountMatch) {
                const dateIndex = trimmedLine.indexOf(dateMatch[0]);
                const dateEnd = dateIndex + dateMatch[0].length;
                const amountIndex = trimmedLine.lastIndexOf(amountMatch[1]); // Use captured group 1 (the number)

                // If the amount starts before the date ends, it's an overlap (part of the date)
                if (amountIndex < dateEnd) {
                    amountMatch = null;
                }
            }

            let dateStr = "";
            let amountStr = "";
            let description = "";
            let isTransaction = false;

            if (dateMatch && amountMatch) {
                // Standard case: Date and Amount on same line
                dateStr = dateMatch[0];
                amountStr = amountMatch[1].trim(); // Use capture group 1 for number only
                description = trimmedLine.replace(dateStr, "").replace(amountMatch[0], "").trim();
                isTransaction = true;
                pendingDate = null; // Reset pending
                pendingDescription = "";
            } else if (dateMatch && !amountMatch) {
                // Potential start of split line
                pendingDate = dateMatch[0];
                // Capture the rest of the line as part of the description
                pendingDescription = trimmedLine.replace(pendingDate, "").trim();
                continue;
            } else if (!dateMatch && amountMatch && pendingDate) {
                // Potential end of split line
                dateStr = pendingDate;
                amountStr = amountMatch[1].trim(); // Use capture group 1
                // Combine pending description with current line (minus amount)
                const currentLineDesc = trimmedLine.replace(amountMatch[0], "").trim();
                description = `${pendingDescription} ${currentLineDesc}`.trim();
                isTransaction = true;
                pendingDate = null; // Reset
                pendingDescription = "";
            }

            if (isTransaction) {
                // Clean up amount string to be a valid number
                // Remove all spaces and non-standard characters first
                amountStr = amountStr.replace(/[^\d.,]/g, "");

                // Robust heuristic to determine decimal separator:
                const lastDotIndex = amountStr.lastIndexOf(".");
                const lastCommaIndex = amountStr.lastIndexOf(",");
                const lastSeparatorIndex = Math.max(lastDotIndex, lastCommaIndex);

                if (lastSeparatorIndex !== -1) {
                    const decimals = amountStr.length - lastSeparatorIndex - 1;

                    if (decimals === 2) {
                        // The last separator is a decimal separator
                        const separator = amountStr[lastSeparatorIndex];
                        if (separator === ".") {
                            const integerPart = amountStr.substring(0, lastSeparatorIndex).replace(/\D/g, "");
                            const decimalPart = amountStr.substring(lastSeparatorIndex + 1);
                            amountStr = `${integerPart}.${decimalPart}`;
                        } else {
                            const integerPart = amountStr.substring(0, lastSeparatorIndex).replace(/\D/g, "");
                            const decimalPart = amountStr.substring(lastSeparatorIndex + 1);
                            amountStr = `${integerPart}.${decimalPart}`;
                        }
                    } else {
                        amountStr = amountStr.replace(/\D/g, "");
                    }
                }

                const amount = parseFloat(amountStr);

                if (isNaN(amount)) continue;

                // Clean up description
                description = fixTurkishChars(description);
                description = description.replace(/\s+/g, " ");
                description = description.replace(/-+/g, "").trim();

                // Skip if description is too short
                if (description.length < 2) continue;

                // FILTERING LOGIC

                // 1. Skip negative amounts (payments/returns)
                // Check if the original line had a negative sign before the amount
                // or if the line starts with a negative sign
                if (trimmedLine.includes("-" + amountMatch![1]) || trimmedLine.startsWith("-")) continue;

                // 2. Skip informational lines based on keywords
                const lowerDesc = description.toLowerCase();
                if (
                    lowerDesc.includes("hesap kesim") ||
                    lowerDesc.includes("son ödeme") ||
                    lowerDesc.includes("son deme") ||
                    lowerDesc.includes("toplam borç") ||
                    lowerDesc.includes("asgari ödeme") ||
                    lowerDesc.includes("asgari deme") ||
                    lowerDesc.includes("devreden") ||
                    lowerDesc.includes("limit") ||
                    lowerDesc.includes("puan") ||
                    lowerDesc.includes("önceki dönem") ||
                    lowerDesc.includes("nceki dnem")
                    // Removed faiz/vergi filters to include BSMV, KKDF, Interest
                ) continue;

                const category = mapDescriptionToCategory(description);

                transactions.push({
                    date: dateStr,
                    description,
                    amount,
                    category
                });
            }
        }

        // Group by Category
        const grouped: Record<string, GroupedExpense> = {};

        transactions.forEach(t => {
            if (!grouped[t.category]) {
                grouped[t.category] = {
                    category: t.category,
                    totalAmount: 0,
                    count: 0,
                    transactions: []
                };
            }
            grouped[t.category].totalAmount += t.amount;
            grouped[t.category].count += 1;
            grouped[t.category].transactions.push(t);
        });

        return { success: true, data: Object.values(grouped), statementTotal };

    } catch (error: unknown) {
        console.error("PDF Parse Error Full Details:", error);
        return { success: false, error: error instanceof Error ? error.message : "PDF okunamadı." };
    }
}
