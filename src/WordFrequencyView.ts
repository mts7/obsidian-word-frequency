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
import { WordCount } from './wordSelection';

export class WordFrequencyView extends ItemView {
    private display: WordFrequencyDisplay;
    private eventListener: (_: CustomEvent) => void = () => {};
    private notePath = '';
    private readonly plugin: WordFrequencyPlugin;
    private resizeObserver: ResizeObserver | undefined;
    private wordCountList: WordCount[] = [];
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
                this.showFirstPageForNewNote(event.detail.notePath);
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
        this.display.listenForWordListClicks(this.wordListContainer);
        this.display.createThresholdDisplay(contentContainer);

        this.updateContent();
        this.listenForResize();
        this.plugin.updateScheduler.updateNow();
    }

    async onClose() {
        window.document.removeEventListener(
            EVENT_UPDATE,
            this.eventListener as EventListener
        );
        this.resizeObserver?.disconnect();
    }

    updateContent() {
        this.wordListContainer.empty();
        this.display.renderWords(this.wordCountList, this.wordListContainer);

        this.display.updateThresholdDisplay();
    }

    showFirstPageForNewNote(notePath: string): void {
        if (notePath === this.notePath) {
            return;
        }

        this.notePath = notePath;
        this.display.showFirstPage();
    }

    private listenForResize(): void {
        this.resizeObserver = new ResizeObserver(() =>
            this.plugin.updateScheduler.updateIfSkipped()
        );
        this.resizeObserver.observe(this.containerEl);
    }
}
