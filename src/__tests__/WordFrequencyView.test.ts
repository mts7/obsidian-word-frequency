import { App, PluginManifest, WorkspaceLeaf } from 'obsidian';
import {
    DEFAULT_SETTINGS,
    ELEMENT_CLASSES,
    EVENT_UPDATE,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';
import { FakeResizeObserver } from './fakes/resizeObserver';
import { createNote, FakeWorkspace } from './fakes/workspace';

describe('WordFrequencyView', () => {
    const PAGE_SIZE = DEFAULT_SETTINGS.pageSize;
    let mockDisplay: WordFrequencyDisplay;
    let mockDivElement: HTMLDivElement;
    let mockLeaf: WorkspaceLeaf;
    let mockPlugin: WordFrequencyPlugin;
    let view: WordFrequencyView;

    beforeEach(() => {
        mockLeaf = new WorkspaceLeaf();
        mockDisplay = {
            createFilter: jest.fn(),
            createHeader: jest.fn(),
            createThresholdDisplay: jest.fn(),
            listenForWordListClicks: jest.fn(),
            renderWords: jest.fn(),
            showFirstPage: jest.fn(),
            updateThresholdDisplay: jest.fn(),
        } as unknown as WordFrequencyDisplay;
        mockDivElement = {
            createDiv: jest.fn().mockReturnValue({
                empty: jest.fn(),
            } as unknown as HTMLDivElement),
            empty: jest.fn(),
        } as unknown as HTMLDivElement;
        mockPlugin = {
            updateScheduler: {
                updateIfSkipped: jest.fn(),
                updateNow: jest.fn(),
            },
            settings: {
                blacklist: 'the, and, to',
                saveData: jest.fn().mockResolvedValue(undefined),
            },
        } as unknown as WordFrequencyPlugin;
        view = new WordFrequencyView(
            mockLeaf,
            mockPlugin,
            mockDisplay,
            mockDivElement
        );

        view.contentEl = {
            empty: jest.fn(),
            createDiv: jest.fn().mockReturnValue(mockDivElement),
            createEl: jest.fn(),
        } as unknown as HTMLElement;
    });

    describe('constructor and getters', () => {
        it('should create an instance of WordFrequencyView', () => {
            expect(view).toBeInstanceOf(WordFrequencyView);
        });

        it('should use the provided WordFrequencyDisplay instance if passed', async () => {
            const displayMock = {
                createFilter: jest.fn(),
                createHeader: jest.fn(),
                createThresholdDisplay: jest.fn(),
                listenForWordListClicks: jest.fn(),
            } as unknown as WordFrequencyDisplay;
            const view = new WordFrequencyView(
                mockLeaf,
                mockPlugin,
                displayMock,
                mockDivElement
            );

            const viewMock = {
                contentEl: {
                    empty: jest.fn(),
                    createDiv: jest.fn().mockReturnValue(mockDivElement),
                } as unknown as HTMLElement,
                display: displayMock,
                listenForResize: jest.fn(),
                onOpen: view.onOpen,
                plugin: mockPlugin,
                showFirstPageForNewNote: jest.fn(),
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            expect(viewMock.updateContent).toHaveBeenCalled();
        });

        it('should create a new WordFrequencyView instance if no display is passed', async () => {
            const view = new WordFrequencyView(
                mockLeaf,
                mockPlugin,
                undefined,
                mockDivElement
            );

            expect(view).toBeInstanceOf(WordFrequencyView);
        });

        it('should return the correct display text', () => {
            expect(view.getDisplayText()).toBe(PLUGIN_NAME);
        });

        it('should return the correct icon name', () => {
            expect(view.getIcon()).toBe(FREQUENCY_ICON);
        });

        it('should return the plugin instance', () => {
            expect(view.getPlugin()).toBe(mockPlugin);
        });

        it('should return the correct view type', () => {
            expect(view.getViewType()).toBe(VIEW_TYPE);
        });
    });

    describe('onOpen', () => {
        it('should add an event listener for EVENT_UPDATE', async () => {
            const addEventListenerSpy = jest.spyOn(
                window.document,
                'addEventListener'
            );

            await view.onOpen();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                EVENT_UPDATE,
                expect.any(Function)
            );
        });

        it('should call updateContent on open', async () => {
            const viewMock = {
                contentEl: {
                    empty: jest.fn(),
                    createDiv: jest.fn().mockReturnValue(mockDivElement),
                } as unknown as HTMLElement,
                display: mockDisplay,
                listenForResize: jest.fn(),
                onOpen: view.onOpen,
                plugin: mockPlugin,
                showFirstPageForNewNote: jest.fn(),
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            expect(viewMock.updateContent).toHaveBeenCalled();
        });

        it('should update wordCountList and call updateContent when EVENT_UPDATE is dispatched', async () => {
            const updateContentSpy = jest.spyOn(view, 'updateContent');

            await view.onOpen();

            const wordCounts = [
                ['apple', 5],
                ['banana', 3],
            ];
            const event = new CustomEvent(EVENT_UPDATE, {
                detail: { wordCounts },
            });
            window.document.dispatchEvent(event);

            expect(updateContentSpy).toHaveBeenCalled();

            updateContentSpy.mockRestore();
        });

        it('should show the first page when the counts are for another note', async () => {
            await view.onOpen();

            window.document.dispatchEvent(
                new CustomEvent(EVENT_UPDATE, {
                    detail: { notePath: 'Fruit.md', wordCounts: [] },
                })
            );

            expect(mockDisplay.showFirstPage).toHaveBeenCalledTimes(1);
            await view.onClose();
        });

        it('should keep the pages shown when the counts are for the same note', async () => {
            await view.onOpen();
            const createEvent = () =>
                new CustomEvent(EVENT_UPDATE, {
                    detail: { notePath: 'Fruit.md', wordCounts: [] },
                });

            window.document.dispatchEvent(createEvent());
            window.document.dispatchEvent(createEvent());

            expect(mockDisplay.showFirstPage).toHaveBeenCalledTimes(1);
            await view.onClose();
        });

        it('should count the current note through the scheduler', async () => {
            await view.onOpen();

            expect(mockPlugin.updateScheduler.updateNow).toHaveBeenCalled();
        });

        it('should ask the scheduler to catch up when it changes size', async () => {
            await view.onOpen();

            FakeResizeObserver.triggerResize(view.containerEl);

            expect(
                mockPlugin.updateScheduler.updateIfSkipped
            ).toHaveBeenCalled();
        });

        it('should call createDiv with specific classes', async () => {
            await view.onOpen();

            expect(view.contentEl.createDiv).toHaveBeenCalledWith({
                cls: ELEMENT_CLASSES.containerContent,
            });
            expect(mockDivElement.createDiv).toHaveBeenCalledWith({
                cls: ELEMENT_CLASSES.containerWordList,
            });
        });

        it('should clear the content and build the display', async () => {
            await view.onOpen();

            expect(view.contentEl.empty).toHaveBeenCalled();
            expect(mockDisplay.createHeader).toHaveBeenCalledWith(
                mockDivElement
            );
            expect(mockDisplay.createFilter).toHaveBeenCalledWith(
                mockDivElement
            );
            expect(mockDisplay.createThresholdDisplay).toHaveBeenCalledWith(
                mockDivElement
            );
        });
    });

    describe('onClose', () => {
        it('should close cleanly when it was never opened', async () => {
            await expect(view.onClose()).resolves.toBeUndefined();
        });

        it('should stop watching its size', async () => {
            await view.onOpen();

            await view.onClose();

            expect(FakeResizeObserver.isObserved(view.containerEl)).toBe(false);
        });

        it('should remove the event listener for EVENT_UPDATE', async () => {
            await view.onOpen();
            const removeEventListenerSpy = jest.spyOn(
                window.document,
                'removeEventListener'
            );

            await view.onClose();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                EVENT_UPDATE,
                expect.any(Function)
            );
        });
    });

    describe('updateContent', () => {
        it('should clear the word list before adding words', () => {
            view.updateContent();

            expect(mockDivElement.empty).toHaveBeenCalled();
        });

        it('should render the word counts in the word list', async () => {
            await view.onOpen();
            const wordCounts = [
                ['apple', 5],
                ['banana', 3],
            ];
            const event = new CustomEvent(EVENT_UPDATE, {
                detail: { wordCounts },
            });

            window.document.dispatchEvent(event);

            const wordList = (mockDivElement.createDiv as jest.Mock).mock
                .results[0].value;

            expect(mockDisplay.renderWords).toHaveBeenLastCalledWith(
                wordCounts,
                wordList
            );
        });

        it('should not add word to sidebar for a invalid event type', async () => {
            const viewMock = {
                contentEl: {
                    empty: jest.fn(),
                    createDiv: jest.fn().mockReturnValue(mockDivElement),
                } as unknown as HTMLElement,
                display: mockDisplay,
                listenForResize: jest.fn(),
                onOpen: view.onOpen,
                plugin: mockPlugin,
                showFirstPageForNewNote: jest.fn(),
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            const event = new CustomEvent('test-event', {
                detail: { wordCounts: 'none' },
            });

            window.document.dispatchEvent(event);

            expect(mockDisplay.renderWords).not.toHaveBeenCalled();
        });
    });

    describe('with the real display', () => {
        let plugin: WordFrequencyPlugin;
        let sidebar: WordFrequencyView;
        let workspace: FakeWorkspace;

        function getListedWords(): string[] {
            return Array.from(
                sidebar.contentEl.querySelectorAll(
                    '.word-frequency-row span:first-child'
                )
            ).map((word) => word.textContent ?? '');
        }

        function waitForSave(): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve));
        }

        beforeEach(async () => {
            workspace = new FakeWorkspace();
            workspace.activateNote(
                createNote('apple apple apple banana banana banana cherry')
            );
            plugin = new WordFrequencyPlugin(
                { workspace: workspace.getWorkspace() } as App,
                { id: 'word-frequency' } as PluginManifest
            );
            const leaf = {} as WorkspaceLeaf;
            sidebar = new WordFrequencyView(leaf, plugin);
            Object.assign(leaf, { view: sidebar });
            workspace.openSidebar(leaf);

            await sidebar.onOpen();
        });

        afterEach(async () => {
            await sidebar.onClose();
        });

        it("should list the current note's words as soon as it opens", () => {
            expect(getListedWords()).toEqual(['apple', 'banana']);
        });

        it('should blacklist a word when its button is clicked', async () => {
            sidebar.contentEl
                .querySelector<HTMLButtonElement>('.word-frequency-row button')
                ?.click();
            await waitForSave();

            expect(getListedWords()).toEqual(['banana']);
            expect(plugin.settings.blacklist.split(',')).toContain('apple');
            expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
        });

        it('should list fewer words with a larger minimum share', () => {
            plugin.settings.threshold = 1;
            plugin.settings.minimumShare = 50;

            sidebar.updateContent();

            expect(getListedWords()).toEqual(['apple', 'banana']);
        });

        it('should list one page at a time until every word is shown', async () => {
            const words = Array.from(
                { length: PAGE_SIZE + 2 },
                (_, index) => `word${String.fromCharCode(97 + index)} `
            ).join('');
            workspace.activateNote(createNote(words.repeat(3)));
            plugin.updateScheduler.updateNow();
            const showMore = () =>
                sidebar.contentEl.querySelector<HTMLButtonElement>(
                    '.word-frequency-show-more'
                );

            expect(getListedWords()).toHaveLength(PAGE_SIZE);

            showMore()?.click();

            expect(getListedWords()).toHaveLength(PAGE_SIZE + 2);
            expect(showMore()).toBeNull();
        });

        it('should list the first page again after switching notes', () => {
            const words = Array.from(
                { length: PAGE_SIZE + 2 },
                (_, index) => `word${String.fromCharCode(97 + index)} `
            ).join('');
            workspace.activateNote(createNote(words.repeat(3), 'Words.md'));
            plugin.updateScheduler.updateNow();
            sidebar.contentEl
                .querySelector<HTMLButtonElement>('.word-frequency-show-more')
                ?.click();
            expect(getListedWords()).toHaveLength(PAGE_SIZE + 2);

            workspace.activateNote(createNote(words.repeat(3), 'Other.md'));
            plugin.updateScheduler.updateNow();

            expect(getListedWords()).toHaveLength(PAGE_SIZE);
        });

        it('should show the current threshold after it changes', () => {
            plugin.settings.threshold = 1;

            sidebar.updateContent();

            expect(
                sidebar.contentEl.querySelector(
                    '.word-frequency-threshold-display'
                )?.textContent
            ).toBe('Current frequency threshold is 1.');
            expect(getListedWords()).toEqual(['apple', 'banana', 'cherry']);
        });
    });
});
