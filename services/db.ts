
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface Memo {
    id: number;
    content: string;
    category: 'Have Fun' | 'Earning' | 'Learning' | 'ToDoList' | 'Insights';
    timestamp: string;
}

export interface ChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    messages: ChatMessage[];
}

let db: SQLite.SQLiteDatabase | null = null;

// --- In-Memory Fallback for Web ---
let memoryMemos: Memo[] = [];
let memorySessions: ChatSession[] = [];
let nextMemoId = 1;

export const initDb = async () => {
    if (Platform.OS === 'web') {
        console.log('⚠️ Running on Web: Using In-Memory Database (Data will be lost on refresh)');
        return;
    }

    try {
        db = await SQLite.openDatabaseAsync('yuji_app.db');

        // Initialize Tables
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            
            CREATE TABLE IF NOT EXISTS memos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                category TEXT,
                timestamp TEXT
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                createdAt TEXT
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sessionId TEXT,
                role TEXT,
                content TEXT,
                timestamp TEXT
            );
        `);
        console.log('✅ SQLite Database Initialized');
    } catch (error) {
        console.error('❌ Failed to init DB:', error);
    }
};

// --- Memo Operations ---

export const addMemo = async (content: string, category: string) => {
    if (db) {
        const timestamp = new Date().toISOString();
        const result = await db.runAsync(
            'INSERT INTO memos (content, category, timestamp) VALUES (?, ?, ?)',
            content, category, timestamp
        );
        return result.lastInsertRowId;
    } else {
        // Fallback
        const newMemo: Memo = {
            id: nextMemoId++,
            content,
            // @ts-ignore
            category,
            timestamp: new Date().toISOString()
        };
        memoryMemos.push(newMemo);
        return newMemo.id;
    }
};

export const getMemos = async (): Promise<Memo[]> => {
    if (db) {
        return await db.getAllAsync('SELECT * FROM memos ORDER BY id DESC');
    }
    return [...memoryMemos].reverse();
};

export const getStatsByCategory = async () => {
    if (db) {
        const result = await db.getAllAsync('SELECT category, COUNT(*) as count FROM memos GROUP BY category');
        // result example: [{ category: 'ToDoList', count: 5 }, ...]
        return result;
    }

    // Fallback
    const stats: Record<string, number> = {};
    memoryMemos.forEach(memo => {
        stats[memo.category] = (stats[memo.category] || 0) + 1;
    });
    return Object.entries(stats).map(([category, count]) => ({ category, count }));
}

export const getMemosByCategory = async (category: string): Promise<Memo[]> => {
    if (db) {
        return await db.getAllAsync(
            'SELECT * FROM memos WHERE category = ? ORDER BY id DESC',
            category
        );
    }
    return [...memoryMemos].filter(m => m.category === category).reverse();
};

// --- Chat Session Operations ---

export const createSession = async (title: string = '新对话'): Promise<string> => {
    // Lazy creation: return ID, save later in ensureSessionCreated
    return Date.now().toString();
};

export const ensureSessionCreated = async (id: string, title: string = '新对话') => {
    const createdAt = new Date().toISOString();

    if (db) {
        const existing = await db.getFirstAsync('SELECT id FROM sessions WHERE id = ?', id);
        if (!existing) {
            await db.runAsync(
                'INSERT INTO sessions (id, title, createdAt) VALUES (?, ?, ?)',
                id, title, createdAt
            );
        }
    } else {
        // Fallback
        const existing = memorySessions.find(s => s.id === id);
        if (!existing) {
            memorySessions.push({
                id,
                title,
                createdAt,
                messages: [] // Initial messages added separately usually, or empty
            });
        }
    }
};

export const getSessions = async (): Promise<ChatSession[]> => {
    if (db) {
        const sessions = await db.getAllAsync('SELECT * FROM sessions ORDER BY createdAt DESC');

        // Populate messages for each session (Optimization: In a real large app, fetch mostly recent msg)
        // For now, we fetch all to match the interface needed by UI
        const populatedSessions: ChatSession[] = [];

        for (const session of sessions) {
            const messages = await db.getAllAsync(
                'SELECT * FROM messages WHERE sessionId = ? ORDER BY timestamp ASC',
                // @ts-ignore
                session.id
            );
            populatedSessions.push({
                // @ts-ignore
                ...session,
                // @ts-ignore
                messages: messages
            });
        }
        return populatedSessions;

    }
    return [...memorySessions].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const getSession = async (id: string): Promise<ChatSession | undefined> => {
    if (db) {
        const session = await db.getFirstAsync('SELECT * FROM sessions WHERE id = ?', id);
        if (!session) return undefined;

        const messages = await db.getAllAsync(
            'SELECT * FROM messages WHERE sessionId = ? ORDER BY timestamp ASC',
            id
        );

        return {
            // @ts-ignore
            ...session,
            // @ts-ignore
            messages: messages
        } as ChatSession;
    }
    return memorySessions.find(s => s.id === id);
};

export const updateSessionTitle = async (id: string, title: string) => {
    if (db) {
        await db.runAsync('UPDATE sessions SET title = ? WHERE id = ?', title, id);
    } else {
        const session = memorySessions.find(s => s.id === id);
        if (session) session.title = title;
    }
};

export const addMessageToSession = async (sessionId: string, message: ChatMessage) => {
    if (db) {
        // Ensure session exists (double check, though ensureSessionCreated should be called)
        // Then insert message
        await db.runAsync(
            'INSERT INTO messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
            message.id, sessionId, message.role, message.content, message.timestamp
        );
    } else {
        const session = memorySessions.find(s => s.id === sessionId);
        if (session) {
            session.messages.push(message);
        }
    }
};

export const deleteSession = async (id: string) => {
    if (db) {
        await db.runAsync('DELETE FROM messages WHERE sessionId = ?', id);
        await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
    } else {
        memorySessions = memorySessions.filter(s => s.id !== id);
    }
};
