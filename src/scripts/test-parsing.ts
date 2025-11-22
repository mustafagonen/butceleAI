
import { formatCurrency } from "../lib/utils";

// Mock data based on user input
const rawText = `
25/08/2025 LCW ANK ANATOLIUM ANKARA TRTR 752.98
25/08/2025 MADAME COCO ANKARA ANATOL 148.7825/08/
2.025,00 TL
26/08/2025 KO  CA  KEBAP 1.700,00 TL
26/08/2025 MADAME COCO ANKARA ARMADA 325,79 TL
27/08/2025 YANIKKAYA GIDA N  SAN T 700,00 TL
27/08/2025 D VERO LU 830,00 TL
28/08/2025 TANDIR UNLU MAMÜLLER N . 45,00 TL
28/08/2025 FILE MAMAK / ANKARA 1.444,34 TL
28/08/2025 ANKA GROSS 249.5030/08/2025  ANSERA KAFETERYA GI
`;

// Copied logic from statement-actions.ts (simplified for testing)
function fixTurkishChars(str: string): string {
    return str
        .replace(/Ð/g, "Ğ")
        .replace(/Ý/g, "İ")
        .replace(/Þ/g, "Ş")
        .replace(/ð/g, "ğ")
        .replace(/ý/g, "ı")
        .replace(/þ/g, "ş")
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
        .replace(/.?NSALLAR/g, "ÜNSALLAR")
        .replace(/.?ZAYDOS/g, "ÖZAYDOS")
        .replace(/VERO.{1,3}LU/g, "VEROĞLU")
        .replace(/MAM.{1,3}LLER/g, "MAMÜLLER")
        .replace(/\sN\s\./g, " İNŞ.")
        .replace(/N.{1,3}SAN.{1,3}T/g, "İNŞ SAN T")
        .replace(/KO.{1,3}CA.{1,3}KEBAP/g, "KOÇ CAĞ KEBAP")
        .replace(/KUAF.{1,3}R.{1,3}G.{1,3}ROL/g, "KUAFÖR GÜROL")
        .replace(/AH.{1,3}NLERTEK/g, "ŞAHİNLER TEK")
        .replace(/GRAT.{1,3}S/g, "GRATİS")
        .replace(/PASTANES\b/g, "PASTANESİ")
        .replace(/ROSSM\b/g, "ROSSMANN")
        .replace(/GI$/g, "GIDA")
        .replace(/D.{1,3}RK/g, "DİREK")
        .replace(/.{0,3}ANSERA/g, "ANSERA")
        .replace(/P.{1,3}KN.{1,3}K/g, "PİKNİK")
        .replace(/FAT.{1,3}H/g, "FATİH")
        .replace(/N.{1,3}AAT/g, "İNŞAAT")
        .replace(/GRATİSANKAMALL/g, "GRATİS ANKAMALL")
        .replace(/GUNGORANKAMALL/g, "GUNGOR ANKAMALL")
        .replace(/Al.{1,3}veri/g, "Alışveriş")
        .replace(/\s+/g, " ");
}
function parse(text: string) {
    const lines = text.split("\n");
    const transactions: any[] = [];
    let pendingDate: string | null = null;
    let pendingDescription: string = "";

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // FIX: Handle run-on lines where a new date starts immediately after an amount
        const runOnMatch = line.match(/([\d,.]+)(\d{2}[./]\d{2}[./])/);
        if (runOnMatch) {
            const splitIndex = line.indexOf(runOnMatch[2], line.indexOf(runOnMatch[1]));
            if (splitIndex !== -1) {
                const part1 = line.substring(0, splitIndex);
                const part2 = line.substring(splitIndex);
                lines[i] = part1;
                lines.splice(i + 1, 0, part2);
                line = part1;
            }
        }

        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const dateRegex = /(\d{1,2}[./]\d{1,2}[./]\d{4})/;
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
            dateStr = dateMatch[0];
            amountStr = amountMatch[1].trim();
            description = trimmedLine.replace(dateStr, "").replace(amountMatch[0], "").trim();
            isTransaction = true;
            pendingDate = null;
            pendingDescription = "";
        } else if (dateMatch && !amountMatch) {
            pendingDate = dateMatch[0];
            pendingDescription = trimmedLine.replace(pendingDate, "").trim();
            continue;
        } else if (!dateMatch && amountMatch && pendingDate) {
            dateStr = pendingDate;
            amountStr = amountMatch[1].trim();
            const currentLineDesc = trimmedLine.replace(amountMatch[0], "").trim();
            description = `${pendingDescription} ${currentLineDesc}`.trim();
            isTransaction = true;
            pendingDate = null;
            pendingDescription = "";
        }

        if (isTransaction) {
            amountStr = amountStr.replace(/[^\d.,]/g, "");
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
            const amount = parseFloat(amountStr);
            if (isNaN(amount)) continue;

            description = fixTurkishChars(description);
            description = description.replace(/\s+/g, " ");
            description = description.replace(/-+/g, "").trim();

            if (description.length < 2) continue;

            transactions.push({
                date: dateStr,
                description,
                amount
            });
        }
    }
    return transactions;
}

const result = parse(rawText);
console.log(`Parsed Transactions: ${result.length}`);
result.forEach((t: any) => {
    console.log(`${t.date} | ${t.description} | ${t.amount}`);
});

// Calculate total
const total = result.reduce((sum: number, t: any) => sum + t.amount, 0);
console.log("Total Amount:", total);
