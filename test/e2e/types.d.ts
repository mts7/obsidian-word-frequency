import type WordFrequencyPlugin from '../../src/main';

declare module 'wdio-obsidian-service' {
    interface InstalledPlugins {
        wordFrequency: WordFrequencyPlugin;
    }
}

declare global {
    interface Window {
        wordFrequencyErrors?: string[];
        wordFrequencyUpdates?: number[];
        wordFrequencyLongTasks?: { start: number; duration: number }[];
    }
}
