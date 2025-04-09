import { debounce, setIcon } from 'obsidian';
import { ELEMENT_CLASSES, PLUGIN_NAME } from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyView } from './WordFrequencyView';

export class WordFrequencyDisplay {
    private filter: string = '';
    private plugin: WordFrequencyPlugin;
    private view: WordFrequencyView;

    constructor(
        plugin: WordFrequencyPlugin,
        view: WordFrequencyView,
        private getFilter: () => string = () => this.filter,
        private debouncedFilterInput = debounce((event: Event) => {
            const target = event.target as HTMLInputElement;
            this.filter = target.value;

            this.view.updateContent();
        }, 500)
    ) {
        this.plugin = plugin;
        this.view = view;
    }

    addWordToSidebar(
        blacklist: Set<string>,
        word: string,
        count: number,
        contentContainer: HTMLDivElement
    ) {
        if (
            blacklist.has(word) ||
            count < this.plugin.settings.threshold ||
            !word.toLowerCase().includes(this.getFilter().toLowerCase())
        ) {
            return;
        }

        const row = contentContainer.createEl('div', {
            cls: ELEMENT_CLASSES.containerRow,
        });

        const wordCountContainer = row.createEl('div', {
            cls: ELEMENT_CLASSES.containerCount,
        });
        wordCountContainer.createEl('span', { text: word });
        wordCountContainer.createEl('span', { text: count.toString() });

        const buttonContainer = row.createEl('div', {
            cls: ELEMENT_CLASSES.containerButton,
        });
        const button = buttonContainer.createEl('button');
        setIcon(button, 'trash-2');
        this.plugin.registerDomEvent(button, 'click', () => {
            this.saveWordToBlacklist(word);
        });
    }

    createFilter(contentEl: HTMLElement) {
        const filterContainer = contentEl.createEl('div', {
            cls: ELEMENT_CLASSES.containerFilter,
        });
        const filterInput = filterContainer.createEl('input', {
            cls: ELEMENT_CLASSES.filter,
            attr: {
                type: 'text',
                placeholder: 'Type to filter results',
            },
        });

        this.plugin.registerDomEvent(filterInput, 'input', (event) =>
            this.debouncedFilterInput(event)
        );
    }

    createHeader(contentEl: HTMLElement) {
        const headerContainer = contentEl.createEl('div');
        const headerElement = headerContainer.createEl('h4');
        headerElement.setText(PLUGIN_NAME);
    }

    createThresholdDisplay(contentEl: HTMLElement) {
        const thresholdDisplay = contentEl.createEl('div', {
            cls: ELEMENT_CLASSES.containerThreshold,
        });
        thresholdDisplay.setText(
            `Current frequency threshold is ${this.plugin.settings.threshold}.`
        );
        thresholdDisplay.setAttr(
            'title',
            'Configure settings for this plugin to update the frequency threshold.'
        );
    }

    saveWordToBlacklist(word: string) {
        const settings = this.plugin.settings;
        settings.blacklist += `,${word}`;
        this.plugin.saveData(settings);
        this.view.updateContent();
    }
}
