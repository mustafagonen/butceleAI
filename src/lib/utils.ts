export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + " TL";
}
