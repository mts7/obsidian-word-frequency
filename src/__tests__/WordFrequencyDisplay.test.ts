import { debounce, setIcon } from 'obsidian';
import {
    DEFAULT_SETTINGS,
    ELEMENT_CLASSES,
    PLUGIN_NAME,
    SHOW_MORE_TEXT,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyDisplay', () => {
    const PAGE_SIZE = DEFAULT_SETTINGS.pageSize;
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
                minimumShare: 0,
                pageSize: PAGE_SIZE,
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

        it('should add the word with count and button to the row', () => {
            const word = 'banana';
            const count = 13;

            display.addWordToSidebar(word, count, contentContainer);

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

        it('should label the button with the word it blacklists', () => {
            display.addWordToSidebar('banana', 13, contentContainer);

            expect(innerElement.createEl).toHaveBeenNthCalledWith(3, 'button', {
                attr: {
                    'aria-label': 'Blacklist banana',
                    'data-word': 'banana',
                },
            });
        });

        it('should not register a listener for each word', () => {
            display.addWordToSidebar('apple', 13, contentContainer);
            display.addWordToSidebar('banana', 13, contentContainer);

            expect(mockPlugin.registerDomEvent).not.toHaveBeenCalled();
            expect(mockView.registerDomEvent).not.toHaveBeenCalled();
        });
    });

    describe('renderWords', () => {
        let wordList: HTMLElement;

        function getListedWords(): string[] {
            return Array.from(
                wordList.querySelectorAll(
                    `.${ELEMENT_CLASSES.containerRow} span:first-child`
                )
            ).map((word) => word.textContent ?? '');
        }

        function getShowMoreButton(): HTMLButtonElement | null {
            return wordList.querySelector(`.${ELEMENT_CLASSES.showMore}`);
        }

        function createWordCounts(total: number): [string, number][] {
            return Array.from({ length: total }, (_, index) => [
                `word${index}`,
                5,
            ]);
        }

        beforeEach(() => {
            wordList = document.createElement('div');
        });

        it('should list the selected words in order', () => {
            display.renderWords(
                [
                    ['apple', 9],
                    ['the', 8],
                    ['banana', 7],
                    ['cherry', 2],
                ],
                wordList
            );

            expect(getListedWords()).toEqual(['apple', 'banana']);
        });

        it('should leave out words below the minimum share', () => {
            mockPlugin.settings.minimumShare = 100;

            display.renderWords(
                [
                    ['apple', 9],
                    ['banana', 7],
                ],
                wordList
            );

            expect(getListedWords()).toEqual(['apple']);
        });

        it('should list filtered words below the minimum share', () => {
            mockPlugin.settings.minimumShare = 100;
            display = new WordFrequencyDisplay(
                mockPlugin,
                mockView,
                () => 'BAN'
            );

            display.renderWords(
                [
                    ['apple', 9],
                    ['banana', 7],
                ],
                wordList
            );

            expect(getListedWords()).toEqual(['banana']);
        });

        it('should list the words chosen by the injected selector', () => {
            const chooseWords = jest
                .fn()
                .mockReturnValue([['chosen', 1]] as [string, number][]);
            mockPlugin.settings.minimumShare = 40;
            display = new WordFrequencyDisplay(
                mockPlugin,
                mockView,
                () => 'cho',
                undefined,
                chooseWords
            );
            const wordCounts: [string, number][] = [['apple', 9]];

            display.renderWords(wordCounts, wordList);

            expect(getListedWords()).toEqual(['chosen']);
            expect(chooseWords).toHaveBeenCalledWith(wordCounts, {
                blacklist: new Set(['the', 'and', 'to']),
                filter: 'cho',
                minimumShare: 40,
                threshold: 3,
            });
        });

        it('should trim spaces from blacklisted words', () => {
            display.renderWords(
                [
                    ['and', 9],
                    ['to', 9],
                    ['apple', 9],
                ],
                wordList
            );

            expect(getListedWords()).toEqual(['apple']);
        });

        it('should list one page of words with a show more button', () => {
            display.renderWords(createWordCounts(PAGE_SIZE + 1), wordList);

            expect(getListedWords()).toHaveLength(PAGE_SIZE);
            expect(getShowMoreButton()?.textContent).toBe(SHOW_MORE_TEXT);
        });

        it('should list the chosen number of words at a time', () => {
            mockPlugin.settings.pageSize = 50;

            display.renderWords(createWordCounts(51), wordList);

            expect(getListedWords()).toHaveLength(50);
            expect(getShowMoreButton()).not.toBeNull();
        });

        it('should not show the button when every word fits on the page', () => {
            display.renderWords(createWordCounts(PAGE_SIZE), wordList);

            expect(getListedWords()).toHaveLength(PAGE_SIZE);
            expect(getShowMoreButton()).toBeNull();
        });

        it('should list another page after show more is clicked', () => {
            const wordCounts = createWordCounts(PAGE_SIZE * 2 + 1);
            mockView.updateContent = jest.fn(() => {
                wordList.empty();
                display.renderWords(wordCounts, wordList);
            });
            display.listenForWordListClicks(wordList);
            display.renderWords(wordCounts, wordList);

            getShowMoreButton()?.click();

            expect(getListedWords()).toHaveLength(PAGE_SIZE * 2);
            expect(getShowMoreButton()).not.toBeNull();
            expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
        });

        it('should list every word once all pages are shown', () => {
            display.showMoreWords();

            display.renderWords(createWordCounts(PAGE_SIZE + 2), wordList);

            expect(getListedWords()).toHaveLength(PAGE_SIZE + 2);
            expect(getShowMoreButton()).toBeNull();
            expect(mockView.updateContent).toHaveBeenCalledTimes(1);
        });

        it('should return to the first page when words at a time changes', () => {
            const wordCounts = createWordCounts(120);
            display.renderWords(wordCounts, wordList);
            display.showMoreWords();
            wordList.empty();
            mockPlugin.settings.pageSize = 50;

            display.renderWords(wordCounts, wordList);

            expect(getListedWords()).toHaveLength(50);
        });

        describe('focus after show more', () => {
            function showMoreOf(total: number) {
                const wordCounts = createWordCounts(total);
                document.body.appendChild(wordList);
                mockView.updateContent = jest.fn(() => {
                    wordList.empty();
                    display.renderWords(wordCounts, wordList);
                });
                display.listenForWordListClicks(wordList);
                display.renderWords(wordCounts, wordList);

                getShowMoreButton()?.click();
            }

            afterEach(() => {
                wordList.remove();
            });

            it('should move focus to the new show more button', () => {
                showMoreOf(PAGE_SIZE * 2 + 1);

                expect(document.activeElement).toBe(getShowMoreButton());
            });

            it('should not fail when the list is empty after show more', () => {
                expect(() =>
                    display.setFocusAfterShowMore(wordList)
                ).not.toThrow();
            });

            it('should move focus to the last word when every word is shown', () => {
                showMoreOf(PAGE_SIZE + 1);
                const buttons = wordList.querySelectorAll('button');

                expect(getShowMoreButton()).toBeNull();
                expect(document.activeElement).toBe(
                    buttons.item(buttons.length - 1)
                );
                expect(
                    (document.activeElement as HTMLButtonElement).dataset.word
                ).toBe(`word${PAGE_SIZE}`);
            });
        });

        it('should return to the first page when the filter changes', () => {
            (debounce as jest.Mock).mockImplementationOnce((callback) =>
                jest.fn(callback)
            );
            display = new WordFrequencyDisplay(mockPlugin, mockView);
            display.createFilter(document.createElement('div'));
            const inputHandler = (mockPlugin.registerDomEvent as jest.Mock).mock
                .calls[0][2];
            display.showMoreWords();

            inputHandler({ target: { value: 'word' } });
            display.renderWords(createWordCounts(PAGE_SIZE * 2), wordList);

            expect(getListedWords()).toHaveLength(PAGE_SIZE);
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
            display.renderWords([['apple', 5]], contentContainer);

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

        it('should show the minimum share when it is above 0', () => {
            const sidebar = document.createElement('div');
            display.createThresholdDisplay(sidebar);
            mockPlugin.settings.minimumShare = 25;

            display.updateThresholdDisplay();

            expect(sidebar.textContent).toBe(
                'Current frequency threshold is 3. Listing words used at least 25% as often as the top word.'
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
            display.listenForWordListClicks(wordList);
            ['apple', 'banana', 'cherry'].forEach((word) =>
                display.addWordToSidebar(word, 5, wordList)
            );

            wordList.querySelectorAll('button')[1].click();

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
        });
    });

    describe('listenForWordListClicks', () => {
        let wordList: HTMLDivElement;
        let row: HTMLDivElement;
        let wordText: HTMLSpanElement;
        let countText: HTMLSpanElement;
        let icon: HTMLElement;
        let originalBlacklist: string;

        beforeEach(() => {
            wordList = document.createElement('div');
            row = document.createElement('div');
            row.className = ELEMENT_CLASSES.containerRow;
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

            display.listenForWordListClicks(wordList);
        });

        it('should register one click listener with the view', () => {
            expect(mockView.registerDomEvent).toHaveBeenCalledTimes(1);
            expect(mockView.registerDomEvent).toHaveBeenCalledWith(
                wordList,
                'click',
                expect.any(Function)
            );
        });

        it('should remove the row of the clicked button', () => {
            icon.click();

            expect(wordList.contains(row)).toBe(false);
        });

        it('should blacklist the word of the clicked button', () => {
            icon.click();

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
            expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
        });

        it('should blacklist the word once when its button is clicked twice', () => {
            icon.click();
            icon.click();

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
            expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
        });

        it.each([
            ['the word', () => wordText],
            ['the count', () => countText],
            ['the row', () => row],
            ['the list', () => wordList],
        ])('should not blacklist anything when %s is clicked', (_, target) => {
            target().click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
        });

        it('should ignore a button without a word', () => {
            const otherButton = document.createElement('button');
            row.appendChild(otherButton);

            otherButton.click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
        });

        it('should ignore a word button outside the list', () => {
            const outerButton = document.createElement('button');
            outerButton.dataset.word = 'outer';
            outerButton.appendChild(wordList);

            wordText.click();

            expect(mockPlugin.settings.blacklist).toBe(originalBlacklist);
            expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
        });
    });

    describe('saveWordToBlacklist', () => {
        it('should append the word and save the settings', async () => {
            const originalBlacklist = mockPlugin.settings.blacklist;

            await display.saveWordToBlacklist('banana');

            expect(mockPlugin.settings.blacklist).toBe(
                `${originalBlacklist},banana`
            );
            expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
            expect(mockPlugin.saveData).not.toHaveBeenCalled();
            expect(mockView.updateContent).not.toHaveBeenCalled();
        });

        it.each([
            ['empty', ''],
            ['blank', '  '],
        ])(
            'should save only the word when the blacklist is %s',
            async (_, originalBlacklist) => {
                mockPlugin.settings.blacklist = originalBlacklist;

                await display.saveWordToBlacklist('banana');

                expect(mockPlugin.settings.blacklist).toBe('banana');
            }
        );

        it('should wait for the settings to save', async () => {
            const error = new Error('save failed');
            (mockPlugin.saveSettings as jest.Mock).mockRejectedValue(error);

            await expect(display.saveWordToBlacklist('banana')).rejects.toBe(
                error
            );
        });
    });
});
