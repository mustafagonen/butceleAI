import { INCOME_CATEGORIES, CATEGORIES, PAYMENT_TYPES } from "./constants";

export const getCategoryLabel = (category: string, t: (key: string) => string): string => {
    // Check if it's an income category
    if (INCOME_CATEGORIES.includes(category)) {
        // Handle special characters or spaces in keys if necessary, but our keys match the values
        // We might need to handle "Kredi/Borç" specifically if it's a key
        return t(`incomeCategories.${category}`) !== `incomeCategories.${category}`
            ? t(`incomeCategories.${category}`)
            : category;
    }

    // Check if it's an expense category
    if (CATEGORIES.includes(category)) {
        return t(`categories.${category}`) !== `categories.${category}`
            ? t(`categories.${category}`)
            : category;
    }

    return category;
};

export const getPaymentMethodLabel = (method: string, t: (key: string) => string): string => {
    if (PAYMENT_TYPES.includes(method)) {
        return t(`paymentTypes.${method}`) !== `paymentTypes.${method}`
            ? t(`paymentTypes.${method}`)
            : method;
    }
    return method;
};
