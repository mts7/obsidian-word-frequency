import { PLUGIN_NAME } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyDisplay', () => {
    let display: WordFrequencyDisplay;
    let contentEl: HTMLElement;
    let mockPlugin: WordFrequencyPlugin;
    let mockView: WordFrequencyView;

    beforeEach(() => {
        mockPlugin = {
            activateView: jest.fn(),
            onload: jest.fn(),
            onunload: jest.fn(),
            saveSettings: jest.fn(),
            settings: {
                blacklist: 'the, and, to',
                threshold: 3,
                saveData: jest.fn().mockResolvedValue(undefined),
            },
        } as any as WordFrequencyPlugin;
        mockView = {
            getDisplayText: jest.fn(),
            getIcon: jest.fn(),
            getPlugin: jest.fn().mockReturnValue(mockPlugin),
            getViewType: jest.fn(),
            onOpen: jest.fn(),
            onClose: jest.fn(),
            updateContent: jest.fn(),
        } as any as WordFrequencyView;
        contentEl = {
            createEl: jest.fn().mockReturnValue({
                createEl: jest.fn().mockReturnThis(),
                setAttr: jest.fn(),
                setText: jest.fn(),
            }),
        } as any as HTMLElement;

        display = new WordFrequencyDisplay(mockPlugin, mockView);
    });

    describe('addWordToSidebar', () => {
        it('should return early when the word is in the blacklist', () => {
            const contentContainer = {
                createEl: jest.fn(),
            } as any as HTMLDivElement;
            const blacklist = new Set(mockPlugin.settings.blacklist.split(',').map(word => word.trim()));
            const word = 'the';
            const count = 17;

            display.addWordToSidebar(blacklist, word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });

        it('should return early when the word count is less than the threshold setting', () => {
            const contentContainer = {
                createEl: jest.fn(),
            } as any as HTMLDivElement;
            const blacklist = new Set(mockPlugin.settings.blacklist.split(',').map(word => word.trim()));
            const word = 'banana';
            const count = 1;

            display.addWordToSidebar(blacklist, word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });

        it('should add the word and count to the row', () => {

        });

        it('should add a button to the row', () => {

        });

        it('should have an event listener on the button', () => {

        });
    });

    describe('createHeader', () => {
        it('should set text in the content', () => {
            display.createHeader(contentEl);

            expect(contentEl.createEl).toHaveBeenCalledWith('div');
            const headerContainer = contentEl.createEl('div');
            expect(headerContainer.createEl).toHaveBeenCalledWith('h4');
            const headerElement = headerContainer.createEl('h4');
            expect(headerElement.createEl).toHaveBeenCalledWith('h4');
            expect(headerElement.setText).toHaveBeenCalledWith(PLUGIN_NAME);
        });
    });

    describe('createThresholdDisplay', () => {
        it('should set text and attribute in the content', () => {
            display.createThresholdDisplay(contentEl);

            const thresholdDisplay = contentEl.createEl('div', { cls: 'threshold-display' });

            expect(contentEl.createEl).toHaveBeenCalledWith('div', { cls: 'threshold-display' });
            expect(thresholdDisplay.setText).toHaveBeenCalledWith(`Current Frequency Threshold is ${mockPlugin.settings.threshold}.`);
            expect(thresholdDisplay.setAttr).toHaveBeenCalledWith('title', 'Configure settings for this plugin to update the frequency threshold.');
        });
    });
});
