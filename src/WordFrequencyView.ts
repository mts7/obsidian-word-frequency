import { ItemView, WorkspaceLeaf } from 'obsidian';
import {
    EVENT_UPDATE,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyDisplay } from './WordFrequencyDisplay';

export class WordFrequencyView extends ItemView {
    private display: WordFrequencyDisplay;
    private eventListener: (event: CustomEvent) => void = () => {};
    private readonly plugin: WordFrequencyPlugin;
    private wordCountList: [string, number][] = [];

    constructor(
        leaf: WorkspaceLeaf,
        plugin: WordFrequencyPlugin,
        display?: WordFrequencyDisplay
    ) {
        super(leaf);
        this.plugin = plugin;
        this.display = display ?? new WordFrequencyDisplay(plugin, this);
    }

    getDisplayText(): string {
        return PLUGIN_NAME;
    }

    getIcon(): string {
        return FREQUENCY_ICON;
    }

    getPlugin(): WordFrequencyPlugin {
        return this.plugin;
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    async onOpen() {
        this.eventListener = (event: CustomEvent) => {
            if (event.type === EVENT_UPDATE) {
                this.wordCountList = event.detail.wordCounts;
                this.updateContent();
            }
        };
        window.document.addEventListener(
            EVENT_UPDATE,
            this.eventListener as EventListener
        );

        this.updateContent();
    }

    async onClose() {
        window.document.removeEventListener(
            EVENT_UPDATE,
            this.eventListener as EventListener
        );
    }

    updateContent() {
        this.contentEl.empty();
        this.display.createHeader(this.contentEl);
        const contentContainer = this.contentEl.createEl('div');
        const blacklist = new Set(
            this.plugin.settings.blacklist.split(',').map((word) => word.trim())
        );

        this.wordCountList.forEach(([word, count]) => {
            this.display.addWordToSidebar(
                blacklist,
                word,
                count,
                contentContainer
            );
        });
        this.display.createThresholdDisplay(this.contentEl);
    }
}
