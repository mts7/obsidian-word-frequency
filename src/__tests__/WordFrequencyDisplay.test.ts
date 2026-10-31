import { debounce, setIcon } from 'obsidian';
import { ELEMENT_CLASSES, PLUGIN_NAME } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyDisplay', () => {
    let blacklist: Set<string>;
    let display: WordFrequencyDisplay;
    let contentEl: HTMLElement;
    let firstElement: HTMLElement;
    let mockPlugin: WordFrequencyPlugin;
    let mockView: WordFrequencyView;
    let secondElement: HTMLElement;

    beforeEach(() => {
        mockPlugin = {
            activateView: jest.fn(),
            onload: jest.fn(),
            onunload: jest.fn(),
            registerDomEvent: jest.fn(),
            saveData: jest.fn(),
            saveSettings: jest.fn(),
            settings: {
                blacklist: 'the, and, to',
                threshold: 3,
                saveData: jest.fn().mockResolvedValue(undefined),
            },
        } as unknown as WordFrequencyPlugin;
        mockView = {
            getDisplayText: jest.fn(),
            getIcon: jest.fn(),
            getPlugin: jest.fn().mockReturnValue(mockPlugin),
            getViewType: jest.fn(),
            onOpen: jest.fn(),
            onClose: jest.fn(),
            registerDomEvent: jest.fn(
                (element: HTMLElement, type: string, handler: EventListener) =>
                    element.addEventListener(type, handler)
            ),
            updateContent: jest.fn(),
        } as unknown as WordFrequencyView;
        secondElement = {
            addClass: jest.fn(),
            createEl: jest.fn(),
            mockCallback: jest.fn(),
            setAttr: jest.fn(),
            setText: jest.fn(),
        } as unknown as HTMLElement;
        firstElement = {
            createEl: jest.fn().mockReturnValue(secondElement),
            setAttr: jest.fn(),
            setText: jest.fn(),
        } as unknown as HTMLElement;
        contentEl = {
            createEl: jest.fn().mockReturnValue(firstElement),
        } as unknown as HTMLElement;
        blacklist = new Set(
            mockPlugin.settings.blacklist.split(',').map((word) => word.trim())
        );

        display = new WordFrequencyDisplay(mockPlugin, mockView);
    });

    describe('addWordToSidebar', () => {
        let buttonElement: HTMLButtonElement;
        let contentContainer: HTMLDivElement;
        let innerElement: HTMLDivElement;
        let rowElement: HTMLDivElement;
        let spanElement: HTMLSpanElement;

        beforeEach(() => {
            spanElement = {
                setText: jest.fn(),
            } as unknown as HTMLSpanElement;
            buttonElement = {
                addEventListener: jest.fn(),
            } as unknown as HTMLButtonElement;
            innerElement = {
                createEl: jest
                    .fn()
                    .mockReturnValueOnce(spanElement)
                    .mockReturnValueOnce(spanElement)
                    .mockReturnValueOnce(buttonElement),
            } as unknown as HTMLDivElement;
            rowElement = {
                createEl: jest.fn().mockReturnValue(innerElement),
            } as unknown as HTMLDivElement;
            contentContainer = {
                createEl: jest.fn().mockReturnValue(rowElement),
            } as unknown as HTMLDivElement;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return early when the word is in the blacklist', () => {
            const word = 'the';
            const count = 17;

            display.addWordToSidebar(blacklist, word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });

        it('should return early when the word count is less than the threshold setting', () => {
            const word = 'banana';
            const count = 1;

            display.addWordToSidebar(blacklist, word, count, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
            expect(setIcon).not.toHaveBeenCalled();
            expect(mockPlugin.registerDomEvent).not.toHaveBeenCalled();
        });

        it('should add the word with count and button to the row', () => {
            const word = 'banana';
            const count = 13;

            display.addWordToSidebar(blacklist, word, count, contentContainer);

            expect(contentContainer.createEl).toHaveBeenCalledWith('div', {
                cls: ELEMENT_CLASSES.containerRow,
            });
            expect(rowElement.createEl).toHaveBeenNthCalledWith(1, 'div', {
                cls: ELEMENT_CLASSES.containerCount,
            });
            expect(rowElement.createEl).toHaveBeenNthCalledWith(2, 'div', {
                cls: ELEMENT_CLASSES.containerButton,
            });
            expect(innerElement.createEl).toHaveBeenNthCalledWith(1, 'span', {
                text: word,
            });
            expect(innerElement.createEl).toHaveBeenNthCalledWith(2, 'span', {
                text: count.toString(),
            });
            expect((innerElement.createEl as jest.Mock).mock.calls[2][0]).toBe(
                'button'
            );
            expect(setIcon).toHaveBeenCalledWith(buttonElement, 'eye-off');
        });

        it('should not register a listener for each word', () => {
            display.addWordToSidebar(blacklist, 'apple', 13, contentContainer);
            display.addWordToSidebar(blacklist, 'banana', 13, contentContainer);

            expect(mockPlugin.registerDomEvent).not.toHaveBeenCalled();
            expect(mockView.registerDomEvent).not.toHaveBeenCalled();
        });

        it('should add word if it matches the filter and has the threshold count', () => {
            display = new WordFrequencyDisplay(
                mockPlugin,
                mockView,
                () => 'BAN'
            );

            display.addWordToSidebar(
                new Set(),
                'banana',
                mockPlugin.settings.threshold,
                contentContainer
            );

            expect(contentContainer.createEl).toHaveBeenCalledWith('div', {
                cls: ELEMENT_CLASSES.containerRow,
            });
            expect(setIcon).toHaveBeenCalledWith(buttonElement, 'eye-off');
        });

        it('should not add word if it does not match the filter', () => {
            display = new WordFrequencyDisplay(
                mockPlugin,
                mockView,
                () => 'xyz'
            );

            display.addWordToSidebar(new Set(), 'banana', 10, contentContainer);

            expect(contentContainer.createEl).not.toHaveBeenCalled();
            expect(setIcon).not.toHaveBeenCalled();
            expect(mockPlugin.registerDomEvent).not.toHaveBeenCalled();
        });
    });

    describe('createFilter', () => {
        it('should create an input element with a container', () => {
            display.createFilter(contentEl);

            expect(contentEl.createEl).toHaveBeenCalledWith('div', {
                cls: ELEMENT_CLASSES.containerFilter,
            });
            expect(firstElement.createEl).toHaveBeenCalledWith('input', {
                cls: ELEMENT_CLASSES.filter,
                attr: {
                    type: 'text',
                    placeholder: 'Type to filter results',
                },
            });
        });

        it('should register a DOM event with the input element', () => {
            display.createFilter(contentEl);

            expect(mockPlugin.registerDomEvent).toHaveBeenCalledWith(
                secondElement,
                'input',
                expect.any(Function)
            );
        });

        it('should update view content when the filter input changes', () => {
            (debounce as jest.Mock).mockImplementationOnce((callback) =>
                jest.fn(callback)
            );
            display = new WordFrequencyDisplay(mockPlugin, mockView);
            const contentContainer = {
                createEl: jest.fn().mockReturnValue(firstElement),
            } as unknown as HTMLDivElement;

            display.createFilter(contentEl);
            const inputHandler = (mockPlugin.registerDomEvent as jest.Mock).mock
                .calls[0][2];
            inputHandler({ target: { value: 'BAN' } });
            display.addWordToSidebar(new Set(), 'apple', 5, contentContainer);

            expect(debounce).toHaveBeenCalledWith(expect.any(Function), 500);
            expect(mockView.updateContent).toHaveBeenCalled();
            expect(contentContainer.createEl).not.toHaveBeenCalled();
        });
    });

    describe('createHeader', () => {
        it('should set text in the content', () => {
            display.createHeader(contentEl);

            expect(contentEl.createEl).toHaveBeenCalledWith('div');
            expect(firstElement.createEl).toHaveBeenCalledWith('h4');
            expect(secondElement.setText).toHaveBeenCalledWith(PLUGIN_NAME);
        });
    });

    describe('createThresholdDisplay', () => {
        it('should set text and attribute in the content', () => {
            display.createThresholdDisplay(contentEl);

            expect(contentEl.createEl).toHaveBeenCalledWith('div', {
                cls: ELEMENT_CLASSES.containerThreshold,
            });
            expect(firstElement.setText).toHaveBeenCalledWith(
                `Current frequency threshold is ${mockPlugin.settings.threshold}.`
            );
            expect(firstElement.setAttr).toHaveBeenCalledWith(
                'title',
                'Configure settings for this plugin to update the frequency threshold.'
            );
        });
    });

    describe('updateThresholdDisplay', () => {
        it('should show the current threshold after it changes', () => {
            const sidebar = document.createElement('div');
            display.createThresholdDisplay(sidebar);
            mockPlugin.settings.threshold = 2;

            display.updateThresholdDisplay();

            expect(sidebar.textContent).toBe(
                'Current frequency threshold is 2.'
            );
        });

        it('should do nothing before the threshold display exists', () => {
            expect(() => display.updateThresholdDisplay()).not.toThrow();
        });
    });

    describe('blacklisting from rendered words', () => {
        it('should blacklist the word whose button is clicked among many rows', () => {
            const wordList = document.createElement('div');
            const originalBlacklist = mockPlugin.settings.blacklist;
            display.listenForBlacklistClicks(wordList);
            ['apple', 'banana', 'cherry'].forEach((word) =>
                display.addWordToSidebar(new Set(), word, 5, wordList)
            );

            wordList.querySelectorAll('button')[1].click();

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
        });
    });

    describe('listenForBlacklistClicks', () => {
        let wordList: HTMLDivElement;
        let row: HTMLDivElement;
        let wordText: HTMLSpanElement;
        let countText: HTMLSpanElement;
        let icon: HTMLElement;
        let originalBlacklist: string;

        beforeEach(() => {
            wordList = document.createElement('div');
            row = document.createElement('div');
            const countContainer = document.createElement('div');
            wordText = document.createElement('span');
            wordText.textContent = 'banana';
            countText = document.createElement('span');
            countText.textContent = '13';
            countContainer.append(wordText, countText);
            const buttonContainer = document.createElement('div');
            const button = document.createElement('button');
            button.dataset.word = 'banana';
            icon = document.createElement('span');
            button.appendChild(icon);
            buttonContainer.appendChild(button);
            row.append(countContainer, buttonContainer);
            wordList.appendChild(row);
            originalBlacklist = mockPlugin.settings.blacklist;

            display.listenForBlacklistClicks(wordList);
        });

        it('should register one click listener with the view', () => {
            expect(mockView.registerDomEvent).toHaveBeenCalledTimes(1);
            expect(mockView.registerDomEvent).toHaveBeenCalledWith(
                wordList,
                'click',
                expect.any(Function)
            );
        });

        it('should blacklist the word of the clicked button', () => {
            icon.click();

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
            expect(mockView.updateContent).toHaveBeenCalled();
        });

        it.each([
            ['the word', () => wordText],
            ['the count', () => countText],
            ['the row', () => row],
            ['the list', () => wordList],
        ])('should not blacklist anything when %s is clicked', (_, target) => {
            target().click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockView.updateContent).not.toHaveBeenCalled();
        });

        it('should ignore a button without a word', () => {
            const otherButton = document.createElement('button');
            row.appendChild(otherButton);

            otherButton.click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockView.updateContent).not.toHaveBeenCalled();
        });

        it('should ignore a word button outside the list', () => {
            const outerButton = document.createElement('button');
            outerButton.dataset.word = 'outer';
            outerButton.appendChild(wordList);

            wordText.click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockView.updateContent).not.toHaveBeenCalled();
        });
    });

    describe('saveWordToBlacklist', () => {
        it('should update blacklist and call saveData and updateContent', () => {
            const word = 'banana';
            const originalBlacklist = mockPlugin.settings.blacklist;

            display.saveWordToBlacklist(word);

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},${word}`
            );
            expect(mockPlugin.saveData).toHaveBeenCalledWith(
                mockPlugin.settings
            );
            expect(mockView.updateContent).toHaveBeenCalled();
        });
    });
});
