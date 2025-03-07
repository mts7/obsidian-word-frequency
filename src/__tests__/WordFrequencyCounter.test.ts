import { WordFrequencyCounter } from '../WordFrequencyCounter';
import { Editor, MarkdownView, Workspace, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE } from '../constants';
import { debounce } from '../utils';

const counter = new WordFrequencyCounter();

describe('WordFrequencyCounter tests', () => {
    describe('calculateWordFrequencies', () => {
        it('should calculate word frequencies', () => {
            const content = 'hello world hello';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([['hello', 2], ['world', 1]]);
        });

        it('should calculate word frequencies with punctuation and mixed case', () => {
            const content = 'Hello, world! hello. World?';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([['hello', 2], ['world', 2]]);
        });

        it('should calculate word frequencies with numbers and special characters', () => {
            const content = 'word1 word2 123 word1 #$% hello. hello.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([['word1', 2], ['hello', 2], ['word2', 1], ['123', 1]]);
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
                view: null
            } as unknown as WorkspaceLeaf;

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it.skip('should call the debounce method to call triggerUpdateContent', () => {
            const workspace: Workspace = {} as unknown as Workspace;
            const containerElMock = {
                addEventListener: jest.fn().mockImplementation(() => {
                    console.log('called addEventListener');
                }),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(containerElMock.addEventListener).toHaveBeenCalled();
            //expect(containerElMock.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
        });

        it('should set lastActiveEditor with a valid MarkdownView', () => {

        });

        it('should not set lastActiveEditor with an invalid MarkdownView', () => {

        });

        it('should trigger update content when there are workspace leaves', () => {

        });

        it('should not trigger update content when there are no workspace leaves', () => {

        });
    });

    describe('triggerUpdateContent', () => {
        it('should not dispatch an event or calculate word frequencies', () => {
            const editor = undefined;
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(window.document, 'dispatchEvent');

            counter.triggerUpdateContent(editor);

            expect(counterMock).not.toHaveBeenCalled();
            expect(dispatchEventMock).not.toHaveBeenCalled();

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should dispatch an event after calculating word frequencies', () => {
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(window.document, 'dispatchEvent');
            const expectedValue = 'hello world hello';
            const expectedEvent = new CustomEvent(
                EVENT_UPDATE,
                { detail: [['hello', 2], ['world', 1]] }
            );
            let editor: Editor;
            editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;

            counter.triggerUpdateContent(editor);

            expect(counterMock).toHaveBeenCalledWith(expectedValue);
            expect(dispatchEventMock).toHaveBeenCalledWith(expectedEvent);

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should write an error to the console when an error is thrown', () => {
            const error = new Error('test error');
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
            });
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
            let editor: Editor;
            editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
            });

            counterMock.triggerUpdateContent(editor);

            expect(consoleErrorSpy).toHaveBeenCalledWith('error in triggerUpdateContent', expectedError);

            consoleErrorSpy.mockRestore();
        });
    });
});
