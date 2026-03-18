import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ReminderPreferences {
    advanceTime: number; 
    allDayTime: string;  
    simpleNotification: boolean;
    autoSyncApp: boolean;
    autoSyncCalendar: boolean;
    autoSyncReminder: boolean;
    autoSyncAlarm: boolean;
}

export const defaultReminderPreferences: ReminderPreferences = {
    advanceTime: 15,
    allDayTime: "10:00",
    simpleNotification: false,
    autoSyncApp: false,
    autoSyncCalendar: false,
    autoSyncReminder: false,
    autoSyncAlarm: false,
};

type SettingsContextType = {
    chatBackground: string | null;
    setChatBackground: (uri: string | null) => void;
    reminderPrefs: ReminderPreferences;
    updateReminderPrefs: (updates: Partial<ReminderPreferences>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chatBackgroundState, setChatBackgroundState] = useState<string | null>(null);
    const [reminderPrefs, setReminderPrefs] = useState<ReminderPreferences>(defaultReminderPreferences);

    // Load from storage on mount
    useEffect(() => {
        (async () => {
            try {
                const storedBg = await AsyncStorage.getItem('chat_background');
                if (storedBg) {
                    setChatBackgroundState(storedBg);
                }

                const storedPrefs = await AsyncStorage.getItem('reminder_prefs');
                if (storedPrefs) {
                    const parsed = JSON.parse(storedPrefs);
                    setReminderPrefs({ ...defaultReminderPreferences, ...parsed });
                }
            } catch (e) {
                console.error('Failed to load settings', e);
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

    const updateReminderPrefs = async (updates: Partial<ReminderPreferences>) => {
        try {
            const newPrefs = { ...reminderPrefs, ...updates };
            setReminderPrefs(newPrefs);
            await AsyncStorage.setItem('reminder_prefs', JSON.stringify(newPrefs));
        } catch (e) {
            console.error('Failed to save reminder prefs', e);
        }
    };

    return (
        <SettingsContext.Provider value={{ chatBackground: chatBackgroundState, setChatBackground, reminderPrefs, updateReminderPrefs }}>
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
