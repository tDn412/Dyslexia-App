import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Settings {
    fontFamily: string;
    fontSize: number;
    letterSpacing: number;
    colorTheme: string;
    readingVoice: string;
    readingSpeed: number;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    loadSettings: () => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: Settings = {
    fontFamily: 'OpenDyslexic',
    fontSize: 18,
    letterSpacing: 0.05,
    colorTheme: 'light',
    readingVoice: 'vi-VN-Standard-A',
    readingSpeed: 1.0,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from Supabase on mount
    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('UserSetting')
                .select('*')
                .eq('userid', 'u003') // Default user, should use actual logged-in user ID
                .single();

            if (error) {
                // If no settings found, use defaults
                console.log('No settings found, using defaults');
                return;
            }

            if (data) {
                setSettings({
                    fontFamily: data.fontfamily || defaultSettings.fontFamily,
                    fontSize: data.fontsize || defaultSettings.fontSize,
                    letterSpacing: data.letterspacing || defaultSettings.letterSpacing,
                    colorTheme: data.colortheme || defaultSettings.colorTheme,
                    readingVoice: data.readingvoice || defaultSettings.readingVoice,
                    readingSpeed: data.readingspeed || defaultSettings.readingSpeed,
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Không thể tải cài đặt');
        } finally {
            setIsLoading(false);
        }
    };

    // Save/update settings to Supabase
    const updateSettings = async (newSettings: Partial<Settings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            // Map to database column names
            const dbSettings = {
                userid: 'u003', // Default user
                fontfamily: updatedSettings.fontFamily,
                fontsize: updatedSettings.fontSize,
                letterspacing: updatedSettings.letterSpacing,
                colortheme: updatedSettings.colorTheme,
                readingvoice: updatedSettings.readingVoice,
                readingspeed: updatedSettings.readingSpeed,
            };

            // Upsert (insert or update)
            const { error } = await supabase
                .from('UserSetting')
                .upsert(dbSettings, { onConflict: 'userid' });

            if (error) {
                console.error('Error saving settings:', error);
                toast.error('Lỗi khi lưu cài đặt: ' + error.message);
                return;
            }

            toast.success('Đã lưu cài đặt!');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Không thể lưu cài đặt');
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Apply global styles based on settings
    useEffect(() => {
        const applyStyles = () => {
            const root = document.documentElement;

            // Apply CSS variables
            root.style.setProperty('--font-family', settings.fontFamily === 'OpenDyslexic'
                ? "'OpenDyslexic', 'Lexend', sans-serif"
                : "'Lexend', sans-serif");
            root.style.setProperty('--font-size', `${settings.fontSize}px`);
            root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);

            // Apply theme
            if (settings.colorTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyStyles();
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loadSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
