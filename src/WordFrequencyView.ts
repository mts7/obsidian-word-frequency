import { ItemView, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, PLUGIN_NAME, VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';

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
        this.createHeader(); // Call new method.
        const contentContainer = this.contentEl.createEl('div');
        const blacklist = new Set(this.getPlugin().settings.blacklist.split(',').map(word => word.trim()));
        this.wordCountList.forEach(([word, count]) => {
            if (blacklist.has(word)) {
                return;
            }
            const div = contentContainer.createEl('div');
            div.setText(`${word}: ${count}`);
        });
    }

    private createHeader() {
        const headerContainer = this.contentEl.createEl('div');
        const headerElement = headerContainer.createEl('h4');
        headerElement.setText(PLUGIN_NAME);
    }}
