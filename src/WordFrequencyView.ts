import { ItemView, WorkspaceLeaf } from 'obsidian';
import {
    ELEMENT_CLASSES,
    EVENT_UPDATE,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyDisplay } from './WordFrequencyDisplay';

export class WordFrequencyView extends ItemView {
    private display: WordFrequencyDisplay;
    private eventListener: (_: CustomEvent) => void = () => {};
    private readonly plugin: WordFrequencyPlugin;
    private wordCountList: [string, number][] = [];
    private wordListContainer: HTMLDivElement;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: WordFrequencyPlugin,
        display?: WordFrequencyDisplay,
        divElement?: HTMLDivElement
    ) {
        super(leaf);
        this.plugin = plugin;
        this.display = display ?? new WordFrequencyDisplay(plugin, this);
        // TODO: find a better way to set a default value
        this.wordListContainer = divElement ?? this.containerEl.createDiv();
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

        this.contentEl.empty();
        const contentContainer = this.contentEl.createDiv({
            cls: ELEMENT_CLASSES.containerContent,
        });
        this.display.createHeader(contentContainer);
        this.display.createFilter(contentContainer);
        this.wordListContainer = contentContainer.createDiv({
            cls: ELEMENT_CLASSES.containerWordList,
        });
        this.display.createThresholdDisplay(contentContainer);

        this.updateContent();
    }

    async onClose() {
        window.document.removeEventListener(
            EVENT_UPDATE,
            this.eventListener as EventListener
        );
    }

    updateContent() {
        this.wordListContainer.empty();
        const blacklist = new Set(
            this.plugin.settings.blacklist.split(',').map((word) => word.trim())
        );

        this.wordCountList.forEach(([word, count]) => {
            this.display.addWordToSidebar(
                blacklist,
                word,
                count,
                this.wordListContainer
            );
        });
    }
}
