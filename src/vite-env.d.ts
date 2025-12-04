interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_AI_API_URL: string;
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
