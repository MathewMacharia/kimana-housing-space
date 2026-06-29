/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RECAPTCHA_SITE_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare global {
    interface Window {
        grecaptcha: {
            enterprise: {
                ready: (callback: () => void) => void;
                render: (elementId: string, options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback': () => void;
                }) => void;
            };
        };
    }
}
