import { PLUGIN_NAME } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyDisplay', () => {
    let blacklist: Set<string>;
    let display: WordFrequencyDisplay;
    let contentEl: HTMLElement;
    let mockPlugin: WordFrequencyPlugin;
    let mockView: WordFrequencyView;

    beforeEach(() => {
        mockPlugin = {
            activateView: jest.fn(),
            onload: jest.fn(),
            onunload: jest.fn(),
            saveData: jest.fn(),
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
        blacklist = new Set(mockPlugin.settings.blacklist.split(',').map(word => word.trim()));

        display = new WordFrequencyDisplay(mockPlugin, mockView, blacklist);
    });

    describe('addWordToSidebar', () => {
        it('should return early when the word is in the blacklist', () => {
            const contentContainer = {
                createEl: jest.fn(),
            } as any as HTMLDivElement;
            const word = 'the';
            const count = 17;

            display.addWordToSidebar(word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });

        it('should return early when the word count is less than the threshold setting', () => {
            const contentContainer = {
                createEl: jest.fn(),
            } as any as HTMLDivElement;
            const word = 'banana';
            const count = 1;

            display.addWordToSidebar(word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });

        it('should add the word with count and button to the row', () => {
            const spanElement = {
                setText: jest.fn(),
            } as any as HTMLSpanElement;
            const buttonElement = {
                addEventListener: jest.fn(),
            } as any as HTMLButtonElement;
            const innerElement = {
                createEl: jest.fn()
                    .mockReturnValueOnce(spanElement)
                    .mockReturnValueOnce(spanElement)
                    .mockReturnValueOnce(buttonElement),
            } as any as HTMLDivElement;
            const rowElement = {
                createEl: jest.fn().mockReturnValue(innerElement),
            } as any as HTMLDivElement;
            const contentContainer = {
                createEl: jest.fn().mockReturnValue(rowElement),
            } as any as HTMLDivElement;
            const word = 'banana';
            const count = 13;

            display.addWordToSidebar(word, count, contentContainer);

            expect(innerElement.createEl).toHaveBeenNthCalledWith(1, 'span', { text: word });
            expect(innerElement.createEl).toHaveBeenNthCalledWith(2, 'span', { text: count.toString() });
            expect(innerElement.createEl).toHaveBeenNthCalledWith(3, 'button');
        });

        it('should update blacklist and call saveData and updateContent', () => {
            const word = 'banana';
            const originalBlacklist = mockPlugin.settings.blacklist;

            display.saveWordToBlacklist(word);

            expect(mockPlugin.settings.blacklist).toBe(`${originalBlacklist},${word}`);
            expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
            expect(mockView.updateContent).toHaveBeenCalled();
        });

        it.todo('should verify the button click event handles the word');
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
