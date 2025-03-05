import { ItemView, WorkspaceLeaf } from 'obsidian';
import WordFrequencyPlugin from './main';

export const EVENT_UPDATE = 'word-frequency:update';
export const PLUGIN_NAME = 'Word Frequency';
export const VIEW_TYPE = 'word-frequency';

export class WordFrequencyView extends ItemView {
    plugin: WordFrequencyPlugin;
    wordCountList: [string, number][] = [];
    private eventListener: (event: CustomEvent) => void = () => {};

    constructor(leaf: WorkspaceLeaf, plugin: WordFrequencyPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return PLUGIN_NAME;
    }

    async onOpen() {
        this.eventListener = (event: CustomEvent) => {
            if (event.type === EVENT_UPDATE) {
                this.wordCountList = event.detail.wordCounts;
                this.updateContent();
            }
        };
        window.document.addEventListener(EVENT_UPDATE, this.eventListener as EventListener);

        this.updateContent();
    }

    async onClose() {
        window.document.removeEventListener(EVENT_UPDATE, this.eventListener as EventListener);
    }

    getPlugin(): WordFrequencyPlugin {
        return this.plugin;
    }

    updateContent() {
        this.contentEl.empty();
        this.contentEl.createEl('h1', PLUGIN_NAME);

        const blacklist = new Set(this.getPlugin().settings.blacklist.split(',').map(word => word.trim()));

        this.wordCountList.forEach(([word, count]) => {
            if (blacklist.has(word)) {
                return;
            }
            const div = this.contentEl.createEl('div');
            div.setText(`${word}: ${count}`);
        });
    }
}
