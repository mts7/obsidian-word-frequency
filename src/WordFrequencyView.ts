import { ItemView, WorkspaceLeaf } from 'obsidian';

export const EVENT_UPDATE = 'word-frequency:update';
export const PLUGIN_NAME = 'Word Frequency';
export const VIEW_TYPE = 'word-frequency';

export class WordFrequencyView extends ItemView {
    private blacklist: Set<string> = new Set([
        'the', 'and', 'to', 'of', 'a', 'in', 'for', 'on', 'is', 'it', 'that', 'with', 'as', 'this', 'by', 'your', 'you',
        'good', 'knowledge', 'general',
    ]);
    wordCountList: [string, number][] = [];
    private eventListener: (event: CustomEvent) => void = () => {};

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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

    updateContent() {
        this.contentEl.empty();
        this.contentEl.createEl('h1', PLUGIN_NAME);

        this.wordCountList.forEach(([word, count]) => {
            if (this.blacklist.has(word)) {
                return;
            }
            const div = this.contentEl.createEl('div');
            div.setText(`${word}: ${count}`);
        });
    }
}
