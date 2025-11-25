// Google Analytics types
declare global {
    interface Window {
        gtag?: (
            command: string,
            targetId: string,
            config?: Record<string, unknown>
        ) => void;
        dataLayer?: unknown[];
    }
}

export { };
