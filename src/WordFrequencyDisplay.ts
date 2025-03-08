import { setIcon } from 'obsidian';
import { PLUGIN_NAME } from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyView } from './WordFrequencyView';

export class WordFrequencyDisplay {
    private plugin: WordFrequencyPlugin;
    private view: WordFrequencyView;

    constructor(plugin: WordFrequencyPlugin, view: WordFrequencyView) {
        this.plugin = plugin;
        this.view = view;
    }

    addWordToSidebar(blacklist: Set<string>, word: string, count: number, contentContainer: HTMLDivElement) {
        if (blacklist.has(word) || count < this.plugin.settings.threshold) {
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
            const settings = this.plugin.settings;
            settings.blacklist += `,${word}`;
            this.plugin.saveData(settings);
            this.view.updateContent();
        });
    }

    createHeader() {
        const headerContainer = this.view.contentEl.createEl('div');
        const headerElement = headerContainer.createEl('h4');
        headerElement.setText(PLUGIN_NAME);
    }

    createThresholdDisplay() {
        const thresholdDisplay = this.view.contentEl.createEl('div', { cls: 'threshold-display' });
        thresholdDisplay.setText(`Current Frequency Threshold is ${this.plugin.settings.threshold}.`);
        thresholdDisplay.setAttr('title', 'Configure settings for this plugin to update the frequency threshold.');
    }
}