import type WordFrequencyPlugin from '../../src/main';

declare module 'wdio-obsidian-service' {
    interface InstalledPlugins {
        wordFrequency: WordFrequencyPlugin;
    }
}

declare global {
    interface Window {
        wordFrequencyErrors?: string[];
    }
}
