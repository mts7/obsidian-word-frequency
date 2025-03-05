import { WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, PLUGIN_NAME, VIEW_TYPE } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyView', () => {
    let mockLeaf: WorkspaceLeaf;
    let mockPlugin: WordFrequencyPlugin;
    let view: WordFrequencyView;
    let contentEl: HTMLElement;

    beforeEach(() => {
        mockLeaf = new WorkspaceLeaf();
        mockPlugin = {
            settings: {
                blacklist: 'the, and, to',
            },
        } as any as WordFrequencyPlugin;
        view = new WordFrequencyView(mockLeaf, mockPlugin);

        let innerHTMLValue = ''; // Track innerHTML separately.

        contentEl = {
            empty: jest.fn(() => {
                innerHTMLValue = ''; // Clear the tracked innerHTML.
            }),
            createEl: jest.fn((tagName: string) => {
                const el = {
                    createEl: jest.fn((innerTagName: string) => {
                        const innerEl = {
                            setText: jest.fn((text: string) => {
                                innerEl.textContent = text;
                                innerHTMLValue += `<${innerTagName}>${text}</${innerTagName}>`; // Update tracked innerHTML.
                            }),
                            textContent: '',
                        };
                        return innerEl;
                    }),
                    setText: jest.fn((text: string) => {
                        el.textContent = text;
                        innerHTMLValue += `<${tagName}>${text}</${tagName}>`;
                    }),
                    textContent: '',
                };
                return el;
            }),
            get innerHTML() { return innerHTMLValue; }, // Expose the tracked innerHTML.
            set innerHTML(value: string) { innerHTMLValue = value; }, // Add setter
        } as any as HTMLElement;
        view.contentEl = contentEl;
    });

    it('should create an instance of WordFrequencyView', () => {
        expect(view).toBeInstanceOf(WordFrequencyView);
    });

    it('should return the correct view type', () => {
        expect(view.getViewType()).toBe(VIEW_TYPE);
    });

    it('should return the correct display text', () => {
        expect(view.getDisplayText()).toBe(PLUGIN_NAME);
    });

    describe('onOpen', () => {
        it('should add an event listener for EVENT_UPDATE', async () => {
            const addEventListenerSpy = jest.spyOn(window.document, 'addEventListener');
            await view.onOpen();
            expect(addEventListenerSpy).toHaveBeenCalledWith(EVENT_UPDATE, expect.any(Function));
        });

        it('should update wordCountList and updateContent when EVENT_UPDATE is dispatched', async () => {
            await view.onOpen();
            const wordCounts: [string, number][] = [['test', 1], ['word', 2]];
            const event = new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } });
            window.document.dispatchEvent(event);
            expect(view.wordCountList).toEqual(wordCounts);
            expect(contentEl.innerHTML).toContain('test: 1');
            expect(contentEl.innerHTML).toContain('word: 2');
        });

        it('should call updateContent on open', async () => {
            const updateContentSpy = jest.spyOn(view, 'updateContent');
            await view.onOpen();
            expect(updateContentSpy).toHaveBeenCalled();
        });
    });

    describe('onClose', () => {
        it('should remove the event listener for EVENT_UPDATE', async () => {
            await view.onOpen();
            const removeEventListenerSpy = jest.spyOn(window.document, 'removeEventListener');
            await view.onClose();
            expect(removeEventListenerSpy).toHaveBeenCalledWith(EVENT_UPDATE, expect.any(Function));
        });
    });

    it('should return the plugin instance', () => {
        expect(view.getPlugin()).toBe(mockPlugin);
    });

    describe('updateContent', () => {
        it('should clear contentEl and create a header element', () => {
            contentEl.innerHTML = '<div>Old Content</div>';
            view.updateContent();
            expect(contentEl.empty).toHaveBeenCalled();
            // Verify that the header is created and added to innerHTML
            expect(contentEl.innerHTML).toContain('<h4>Word Frequency</h4>');
        });

        it('should create divs for each word count', () => {
            view.wordCountList = [['test', 1], ['word', 2]];
            view.updateContent();
            expect(contentEl.innerHTML).toContain('test: 1');
            expect(contentEl.innerHTML).toContain('word: 2');
        });

        it('should not create divs for blacklisted words', () => {
            view.wordCountList = [['test', 1], ['the', 3]];
            view.updateContent();
            expect(contentEl.innerHTML).toContain('test: 1');
            expect(contentEl.innerHTML).not.toContain('the: 3');
        });

        it('should handle an empty wordCountList', () => {
            view.wordCountList = [];
            view.updateContent();
            expect(contentEl.innerHTML).toContain(PLUGIN_NAME);
            expect(contentEl.innerHTML).not.toContain(':');
        });

        it('should handle a wordCountList with only blacklisted words', () => {
            view.wordCountList = [['the', 1], ['and', 2]];
            view.updateContent();
            expect(contentEl.innerHTML).toContain(PLUGIN_NAME);
            expect(contentEl.innerHTML).not.toContain(':');
        });
    });
});
