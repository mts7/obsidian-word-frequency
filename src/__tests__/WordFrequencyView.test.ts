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
                saveData: jest.fn().mockResolvedValue(undefined),
            },
        } as any as WordFrequencyPlugin;
        view = new WordFrequencyView(mockLeaf, mockPlugin);

        let innerHTMLValue = '';
        let elements: HTMLElement[] = [];

        contentEl = {
            empty: jest.fn(() => {
                innerHTMLValue = '';
                elements = [];
            }),
            createEl: jest.fn((tagName: string, options?: { cls?: string, text?: string }) => {
                const element = {
                    createEl: jest.fn((innerTagName: string, innerOptions?: { cls?: string, text?: string }) => {
                        const innerElement: any = {
                            createEl: jest.fn(() => innerElement),
                            setText: jest.fn((text: string) => {
                                innerElement.textContent = text;
                                innerHTMLValue += `<${innerTagName}>${text}</${innerTagName}>`;
                            }),
                            addEventListener: jest.fn(),
                            textContent: '',
                            className: ''
                        };
                        if (innerOptions) {
                            if (innerOptions.text) {
                                innerElement.textContent = innerOptions.text;
                                innerHTMLValue += `<${innerTagName}>${innerOptions.text}</${innerTagName}>`;
                            }
                            if (innerOptions.cls) {
                                innerElement.className = innerOptions.cls;
                            }
                        }
                        elements.push(innerElement);
                        return innerElement;
                    }),
                    setText: jest.fn((text: string) => {
                        element.textContent = text;
                        innerHTMLValue += `<${tagName}>${text}</${tagName}>`;
                    }),
                    setAttr: jest.fn(),
                    addEventListener: jest.fn(),
                    textContent: '',
                    className: ''
                };
                if (options) {
                    if (options.text) {
                        element.textContent = options.text;
                        innerHTMLValue += `<${tagName}>${options.text}</${tagName}>`;
                    }
                    if (options.cls) {
                        element.className = options.cls;
                    }
                }
                elements.push(element as unknown as HTMLElement);
                return element;
            }),
            get innerHTML() {
                return innerHTMLValue;
            },
            set innerHTML(value: string) {
                innerHTMLValue = value;
            },
            querySelectorAll: jest.fn((selector: string) => {
                return elements.filter(el => {
                    if (selector.startsWith('.')) {
                        const className = selector.substring(1);
                        return el.className === className;
                    }
                    if (selector.startsWith('span')) {
                        return el.tagName === 'SPAN';
                    }
                    return false;
                });
            })
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
            expect(contentEl.innerHTML).toContain('<h4>Word Frequency</h4>');
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

    describe.skip('refactor these tests that now have nested HTML tags', () => {
        it('should update wordCountList and updateContent when EVENT_UPDATE is dispatched', async () => {
            await view.onOpen();
            const wordCounts: [string, number][] = [['test', 1], ['word', 2]];
            const event = new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } });
            window.document.dispatchEvent(event);
            expect(view.wordCountList).toEqual(wordCounts);

            const wordRowDivs = contentEl.querySelectorAll('.word-row');
            expect(wordRowDivs.length).toBe(wordCounts.length);

            wordCounts.forEach(([word, count], index) => {
                const wordRow = wordRowDivs[index];
                const wordSpans = wordRow.querySelectorAll('span');

                expect(wordSpans[0].textContent).toBe(word);
                expect(wordSpans[1].textContent).toBe(count.toString());
            });
        });

        it('should create divs for each word count', () => {
            view.wordCountList = [['test', 1], ['word', 2]];
            view.updateContent();

            const wordRowDivs = contentEl.querySelectorAll('.word-row');
            expect(wordRowDivs.length).toBe(view.wordCountList.length);

            view.wordCountList.forEach(([word, count], index) => {
                const wordRow = wordRowDivs[index];
                const wordSpans = wordRow.querySelectorAll('span');

                expect(wordSpans[0].textContent).toBe(word);
                expect(wordSpans[1].textContent).toBe(count.toString());
            });
        });

        it('should not create divs for blacklisted words', () => {
            view.wordCountList = [['test', 1], ['the', 3]];
            view.updateContent();

            const wordRowDivs = contentEl.querySelectorAll('.word-row');
            expect(wordRowDivs.length).toBe(view.wordCountList.length);

            view.wordCountList.forEach(([word, count], index) => {
                const wordRow = wordRowDivs[index];
                const wordSpans = wordRow.querySelectorAll('span');

                expect(wordSpans[0].textContent).toBe(word);
                expect(wordSpans[1].textContent).toBe(count.toString());
            });
        });
    });
});
