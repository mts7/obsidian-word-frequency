import { Editor, MarkdownView, Workspace, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE } from '../constants';
import { WordFrequencyCounter } from '../WordFrequencyCounter';
import WordFrequencyPlugin from '../main';

const mockPlugin = {
    registerDomEvent: jest.fn(),
    registerEvent: jest.fn(),
} as unknown as WordFrequencyPlugin;

const counter = new WordFrequencyCounter(mockPlugin);

describe('WordFrequencyCounter tests', () => {
    beforeEach(() => {
        counter.lastActiveEditor = undefined;
    });

    describe('calculateWordFrequencies', () => {
        it('should calculate word frequencies', () => {
            const content = 'hello world hello';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['hello', 2],
                ['world', 1],
            ]);
        });

        it('should calculate word frequencies with punctuation and mixed case', () => {
            const content = 'Hello, world! hello. World?';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['hello', 2],
                ['world', 2],
            ]);
        });

        it('should calculate word frequencies with numbers and special characters', () => {
            const content = 'word1 word2 123 word1 #$% hello. hello.';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['word1', 2],
                ['hello', 2],
                ['word2', 1],
                ['123', 1],
            ]);
        });

        it('should calculate word frequencies with periods, colons, and slashes', () => {
            const content = 'test. test: test/ test.';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([['test', 4]]);
        });

        it('should return an empty array when given an empty string', () => {
            const result = counter.calculateWordFrequencies('');

            expect(result).toEqual([]);
        });
    });

    describe('handleActiveLeafChange', () => {
        it('should not call triggerUpdateContent when leaf is null', () => {
            const counterMock = {
                handleActiveLeafChange: counter.handleActiveLeafChange,
                triggerUpdateContent: jest.fn(),
            };
            const workspace: Workspace = {} as unknown as Workspace;

            counterMock.handleActiveLeafChange(null, workspace);

            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it('should return when leaf view is not an instance of MarkdownView', () => {
            const counterMock = {
                handleActiveLeafChange: counter.handleActiveLeafChange,
                triggerUpdateContent: jest.fn(),
            };
            const workspace: Workspace = {} as unknown as Workspace;
            const leafMock = {
                view: null,
            } as unknown as WorkspaceLeaf;

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it('should call the debounce method to call triggerUpdateContent', () => {
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(mockPlugin.registerEvent).toHaveBeenCalledWith(mockEvent);
        });

        it('should set lastActiveEditor with a valid MarkdownView', () => {
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest
                    .fn()
                    .mockReturnValue(markdownViewMock),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            expect(counter.lastActiveEditor).toBe(undefined);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(counter.lastActiveEditor).not.toBe(undefined);
        });

        it('should not set lastActiveEditor with an invalid MarkdownView', () => {
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: {
                    getValue: jest.fn().mockReturnValue(''),
                },
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            expect(counter.lastActiveEditor).toBe(undefined);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(counter.lastActiveEditor).toBe(undefined);
        });

        it('should trigger update content when there are workspace leaves', () => {
            const counterMock = {
                calculateWordFrequencies: counter.calculateWordFrequencies,
                handleActiveLeafChange: counter.handleActiveLeafChange,
                plugin: counter.plugin,
                triggerUpdateContent: jest.fn(),
            };
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([leafMock]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).toHaveBeenCalled();
        });

        it('should not trigger update content when there are no workspace leaves', () => {
            const counterMock = {
                calculateWordFrequencies: counter.calculateWordFrequencies,
                handleActiveLeafChange: counter.handleActiveLeafChange,
                plugin: counter.plugin,
                triggerUpdateContent: jest.fn(),
            };
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it.todo('should trigger keyup event to call callback');

        it.todo('should verify call to triggerUpdateContent after 3 seconds');
    });

    describe('triggerUpdateContent', () => {
        it('should not dispatch an event or calculate word frequencies', () => {
            const editor = undefined;
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );

            counter.triggerUpdateContent(editor);

            expect(counterMock).not.toHaveBeenCalled();
            expect(dispatchEventMock).not.toHaveBeenCalled();

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should dispatch an event after calculating word frequencies', () => {
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );
            const expectedValue = 'hello world hello';
            const expectedEvent = new CustomEvent(EVENT_UPDATE, {
                detail: [
                    ['hello', 2],
                    ['world', 1],
                ],
            });
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;

            counter.triggerUpdateContent(editor);

            expect(counterMock).toHaveBeenCalledWith(expectedValue);
            expect(dispatchEventMock).toHaveBeenCalledWith(expectedEvent);

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should call console.error when calculateWordFrequencies throws an error', () => {
            const expectedError = new Error('test error');
            const expectedValue = 'hello world hello';
            const counterMock = {
                calculateWordFrequencies: jest.fn().mockImplementation(() => {
                    throw expectedError;
                }),
                triggerUpdateContent: counter.triggerUpdateContent,
            };
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            counterMock.triggerUpdateContent(editor);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'error in triggerUpdateContent',
                expectedError
            );

            consoleErrorSpy.mockRestore();
        });

        it('should dispatch an event with last active editor when editor is undefined', () => {
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );
            const expectedValue = 'hello world hello';
            const expectedEvent = new CustomEvent(EVENT_UPDATE, {
                detail: [
                    ['hello', 2],
                    ['world', 1],
                ],
            });
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;
            const editorSpy = jest.spyOn(editor, 'getValue');

            counter.lastActiveEditor = editor;
            counter.triggerUpdateContent(undefined);

            expect(counterMock).toHaveBeenCalledWith(expectedValue);
            expect(dispatchEventMock).toHaveBeenCalledWith(expectedEvent);
            expect(editorSpy).toHaveBeenCalled();

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });
    });
});
