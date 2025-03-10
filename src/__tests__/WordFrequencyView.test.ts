import { WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, FREQUENCY_ICON, PLUGIN_NAME, VIEW_TYPE } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyDisplay } from '../WordFrequencyDisplay';
import { WordFrequencyView } from '../WordFrequencyView';

describe('WordFrequencyView', () => {
    let mockDisplay: WordFrequencyDisplay;
    let mockLeaf: WorkspaceLeaf;
    let mockPlugin: WordFrequencyPlugin;
    let view: WordFrequencyView;
    let contentEl: HTMLElement;

    beforeEach(() => {
        mockLeaf = new WorkspaceLeaf();
        mockDisplay = {
            addWordToSidebar: jest.fn(),
            createHeader: jest.fn(),
            createThresholdDisplay: jest.fn(),
        } as any as WordFrequencyDisplay;
        mockPlugin = {
            settings: {
                blacklist: 'the, and, to',
                saveData: jest.fn().mockResolvedValue(undefined),
            },
        } as any as WordFrequencyPlugin;
        view = new WordFrequencyView(mockLeaf, mockPlugin, mockDisplay);

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

    describe('constructor and getters', () => {
        it('should create an instance of WordFrequencyView', () => {
            expect(view).toBeInstanceOf(WordFrequencyView);
        });

        it('should use the provided WordFrequencyDisplay instance if passed', async () => {
            const view = new WordFrequencyView(mockLeaf, mockPlugin, mockDisplay);

            const viewMock = {
                onOpen: view.onOpen,
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            expect(viewMock.updateContent).toHaveBeenCalled();
        });

        it('should create a new WordFrequencyDisplay instance if no display is passed', async () => {
            const view = new WordFrequencyView(mockLeaf, mockPlugin);

            const viewMock = {
                onOpen: view.onOpen,
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            expect(viewMock.updateContent).toHaveBeenCalled();
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
            const addEventListenerSpy = jest.spyOn(window.document, 'addEventListener');

            await view.onOpen();

            expect(addEventListenerSpy).toHaveBeenCalledWith(EVENT_UPDATE, expect.any(Function));
        });

        it('should call updateContent on open', async () => {
            const viewMock = {
                onOpen: view.onOpen,
                updateContent: jest.fn(),
            };

            await viewMock.onOpen();

            expect(viewMock.updateContent).toHaveBeenCalled();
        });

        it('should update wordCountList and call updateContent when EVENT_UPDATE is dispatched', async () => {
            const updateContentSpy = jest.spyOn(view, 'updateContent');

            await view.onOpen();

            const wordCounts = [['apple', 5], ['banana', 3]];
            const event = new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } });
            window.document.dispatchEvent(event);

            expect(updateContentSpy).toHaveBeenCalled();

            updateContentSpy.mockRestore();
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

    describe('updateContent', () => {
        it('should add words to sidebar for each word', async () => {
            await view.onOpen();
            const wordCounts = [['apple', 5], ['banana', 3]];
            const event = new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } });
            const addWordToSidebarSpy = jest.spyOn(mockDisplay, 'addWordToSidebar');

            window.document.dispatchEvent(event);

            expect(addWordToSidebarSpy).toBeCalledTimes(2);

            addWordToSidebarSpy.mockRestore();
        });
    });
});
