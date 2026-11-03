import { debounce, setIcon } from 'obsidian';
import { ELEMENT_CLASSES, PLUGIN_NAME, SHOW_MORE_TEXT } from './constants';
import WordFrequencyPlugin from './main';
import {
    collectBlacklistedWords,
    selectPage,
    selectWords,
    WordCount,
    WordPage,
    WordSelector,
} from './wordSelection';
import { WordFrequencyView } from './WordFrequencyView';

export class WordFrequencyDisplay {
    private filter: string = '';
    private pageSizeShown: number | undefined;
    private pagesShown = 1;
    private plugin: WordFrequencyPlugin;
    private thresholdDisplay: HTMLElement | undefined;
    private view: WordFrequencyView;

    constructor(
        plugin: WordFrequencyPlugin,
        view: WordFrequencyView,
        private getFilter: () => string = () => this.filter,
        private debouncedFilterInput = debounce((event: Event) => {
            const target = event.target as HTMLInputElement;
            this.filter = target.value;
            this.showFirstPage();

            this.view.updateContent();
        }, 500),
        private chooseWords: WordSelector = selectWords
    ) {
        this.plugin = plugin;
        this.view = view;
    }

    renderWords(wordCounts: WordCount[], wordList: HTMLElement) {
        this.resetPagesForPageSize(this.plugin.settings.pageSize);
        const { hasMore, words } = this.findVisibleWords(wordCounts);

        words.forEach(([word, count]) =>
            this.addWordToSidebar(word, count, wordList)
        );
        if (hasMore) {
            this.addShowMoreButton(wordList);
        }
    }

    resetPagesForPageSize(pageSize: number) {
        if (
            this.pageSizeShown !== undefined &&
            pageSize !== this.pageSizeShown
        ) {
            this.showFirstPage();
        }

        this.pageSizeShown = pageSize;
    }

    showFirstPage() {
        this.pagesShown = 1;
    }

    findVisibleWords(wordCounts: WordCount[]): WordPage {
        const { blacklist, minimumShare, pageSize, threshold } =
            this.plugin.settings;
        const words = this.chooseWords(wordCounts, {
            blacklist: collectBlacklistedWords(blacklist),
            filter: this.getFilter(),
            minimumShare,
            threshold,
        });

        return selectPage(words, this.pagesShown, pageSize);
    }

    addShowMoreButton(wordList: HTMLElement) {
        wordList.createEl('button', {
            cls: ELEMENT_CLASSES.showMore,
            text: SHOW_MORE_TEXT,
        });
    }

    addWordToSidebar(
        word: string,
        count: number,
        contentContainer: HTMLElement
    ) {
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
        const button = buttonContainer.createEl('button', {
            attr: { 'aria-label': `Blacklist ${word}`, 'data-word': word },
        });
        setIcon(button, 'eye-off');
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
        this.thresholdDisplay = contentEl.createEl('div', {
            cls: ELEMENT_CLASSES.containerThreshold,
        });
        this.thresholdDisplay.setAttr(
            'title',
            'Configure settings for this plugin to update the frequency threshold.'
        );
        this.updateThresholdDisplay();
    }

    updateThresholdDisplay() {
        this.thresholdDisplay?.setText(this.createThresholdText());
    }

    createThresholdText(): string {
        const { minimumShare, threshold } = this.plugin.settings;
        const thresholdText = `Current frequency threshold is ${threshold}.`;
        if (minimumShare === 0) {
            return thresholdText;
        }

        return `${thresholdText} Listing words used at least ${minimumShare}% as often as the top word.`;
    }

    listenForWordListClicks(wordList: HTMLElement) {
        this.view.registerDomEvent(wordList, 'click', async (event) => {
            const button = (event.target as HTMLElement).closest('button');
            if (!button || !wordList.contains(button)) {
                return;
            }
            if (button.classList.contains(ELEMENT_CLASSES.showMore)) {
                this.showMoreWords();
                this.setFocusAfterShowMore(wordList);
                return;
            }

            await this.handleBlacklistClick(button);
        });
    }

    async handleBlacklistClick(button: HTMLButtonElement) {
        const word = button.dataset.word;
        if (word === undefined) {
            return;
        }

        button.closest(`.${ELEMENT_CLASSES.containerRow}`)?.remove();
        await this.saveWordToBlacklist(word);
    }

    setFocusAfterShowMore(wordList: HTMLElement) {
        const buttons = wordList.querySelectorAll<HTMLButtonElement>('button');
        buttons.item(buttons.length - 1)?.focus();
    }

    showMoreWords() {
        this.pagesShown += 1;
        this.view.updateContent();
    }

    async saveWordToBlacklist(word: string) {
        const settings = this.plugin.settings;
        settings.blacklist = settings.blacklist.trim()
            ? `${settings.blacklist},${word}`
            : word;
        await this.plugin.saveSettings();
    }
}
