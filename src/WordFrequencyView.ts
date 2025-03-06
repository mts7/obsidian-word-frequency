import { ItemView, setIcon, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, PLUGIN_NAME, VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';

export class WordFrequencyView extends ItemView {
    plugin: WordFrequencyPlugin;
    wordCountList: [string, number][] = [];
    private eventListener: (event: CustomEvent) => void = () => {
    };

    constructor(leaf: WorkspaceLeaf, plugin: WordFrequencyPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getIcon(): string {
        return 'file-chart-column-increasing';
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
        this.createHeader();
        const contentContainer = this.contentEl.createEl('div');
        const blacklist = new Set(this.getPlugin().settings.blacklist.split(',').map(word => word.trim()));

        this.wordCountList.forEach(([word, count]) => {
            if (blacklist.has(word) || count < this.getPlugin().settings.threshold) {
                return;
            }

            const row = contentContainer.createEl('div', { cls: 'word-row' });
            const wordCountContainer = row.createEl('div', { cls: 'word-count-container' });
            wordCountContainer.createEl('span', { text: word });
            wordCountContainer.createEl('span', { text: count.toString() });

            const buttonContainer = row.createEl('div', { cls: 'button-container' });
            const button = buttonContainer.createEl('button');
            setIcon(button, 'trash-2');
            button.addEventListener('click', () => {
                const settings = this.getPlugin().settings;
                settings.blacklist += `,${word}`;
                this.getPlugin().saveData(settings);
                this.updateContent();
            });
        });

        const thresholdDisplay = this.contentEl.createEl('div', { cls: 'threshold-display' });
        thresholdDisplay.setText(`Current Frequency Threshold is ${this.getPlugin().settings.threshold}.`);
        thresholdDisplay.setAttr('title', 'Configure settings for this plugin to update the frequency threshold.');
    }

    private createHeader() {
        const headerContainer = this.contentEl.createEl('div');
        const headerElement = headerContainer.createEl('h4');
        headerElement.setText(PLUGIN_NAME);
    }
}
