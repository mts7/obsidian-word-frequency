import { WorkspaceLeaf } from 'obsidian';
import {
    ELEMENT_CLASSES,
    EVENT_UPDATE,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyView', () => {
    let mockDisplay: WordFrequencyDisplay;
    let mockDivElement: HTMLDivElement;
    let mockLeaf: WorkspaceLeaf;
    let mockPlugin: WordFrequencyPlugin;
    let view: WordFrequencyView;

    beforeEach(() => {
        mockLeaf = new WorkspaceLeaf();
        mockDisplay = {
            addWordToSidebar: jest.fn(),
            createFilter: jest.fn(),
            createHeader: jest.fn(),
            createThresholdDisplay: jest.fn(),
        } as unknown as WordFrequencyDisplay;
        mockDivElement = {
            createDiv: jest.fn().mockReturnValue({
                empty: jest.fn(),
            } as unknown as HTMLDivElement),
            empty: jest.fn(),
        } as unknown as HTMLDivElement;
        mockPlugin = {
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
                addWordToSidebar: jest.fn(),
                createFilter: jest.fn(),
                createHeader: jest.fn(),
                createThresholdDisplay: jest.fn(),
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
                onOpen: view.onOpen,
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
                onOpen: view.onOpen,
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

        it('should call createDiv with specific classes', async () => {
            await view.onOpen();

            expect(view.contentEl.createDiv).toHaveBeenCalledWith({
                cls: ELEMENT_CLASSES.containerContent,
            });
            expect(mockDivElement.createDiv).toHaveBeenCalledWith({
                cls: ELEMENT_CLASSES.containerWordList,
            });
        });
    });

    describe('onClose', () => {
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
        it('should add words to sidebar for each word', async () => {
            await view.onOpen();
            const wordCounts = [
                ['apple', 5],
                ['banana', 3],
            ];
            const event = new CustomEvent(EVENT_UPDATE, {
                detail: { wordCounts },
            });
            const addWordToSidebarSpy = jest.spyOn(
                mockDisplay,
                'addWordToSidebar'
            );
            const expectedBlacklist = new Set(
                mockPlugin.settings.blacklist
                    .split(',')
                    .map((word) => word.trim())
            );

            window.document.dispatchEvent(event);

            const calls = addWordToSidebarSpy.mock.calls;

            expect(addWordToSidebarSpy).toHaveBeenCalledTimes(2);
            expect(calls).toHaveLength(2);
            expect(calls[0][0]).toEqual(expectedBlacklist);
            expect(calls[0][1]).toBe('apple');
            expect(calls[0][2]).toBe(5);
            expect(calls[0][0]).toEqual(calls[1][0]);
            expect(calls[1][1]).toBe('banana');
            expect(calls[1][2]).toBe(3);

            addWordToSidebarSpy.mockRestore();
        });

        it('should not add word to sidebar for a invalid event type', async () => {
            const viewMock = {
                contentEl: {
                    empty: jest.fn(),
                    createDiv: jest.fn().mockReturnValue(mockDivElement),
                } as unknown as HTMLElement,
                display: mockDisplay,
                onOpen: view.onOpen,
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            const event = new CustomEvent('test-event', {
                detail: { wordCounts: 'none' },
            });

            window.document.dispatchEvent(event);

            expect(mockDisplay.addWordToSidebar).not.toHaveBeenCalled();
        });
    });
});
