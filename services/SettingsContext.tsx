
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SettingsContextType = {
    chatBackground: string | null;
    setChatBackground: (uri: string | null) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chatBackground, setChatBackgroundState] = useState<string | null>(null);

    // Load from storage on mount
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('chat_background');
                if (stored) {
                    setChatBackgroundState(stored);
                }
            } catch (e) {
                console.error('Failed to load chat background', e);
            }
        })();
    }, []);

    const setChatBackground = async (uri: string | null) => {
        try {
            if (uri) {
                await AsyncStorage.setItem('chat_background', uri);
            } else {
                await AsyncStorage.removeItem('chat_background');
            }
            setChatBackgroundState(uri);
        } catch (e) {
            console.error('Failed to save chat background', e);
        }
    };

    return (
        <SettingsContext.Provider value={{ chatBackground, setChatBackground }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
