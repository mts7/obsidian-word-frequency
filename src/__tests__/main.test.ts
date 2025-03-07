import WordFrequencyPlugin from '../main';
import { App, WorkspaceLeaf, PluginManifest, MarkdownView, Editor } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';
import { WordFrequencyCounter } from '../WordFrequencyCounter';

jest.mock('../utils', () => ({
    debounce: jest.fn((func) => func),
}));

interface MockApp extends App {
    workspace: any;
    loadData: jest.Mock;
    saveData: jest.Mock;
}

const mockApp: MockApp = {
    workspace: {
        on: jest.fn(),
        getLeavesOfType: jest.fn(),
        getRightLeaf: jest.fn(),
        revealLeaf: jest.fn(),
        getActiveViewOfType: jest.fn(),
        setViewState: jest.fn(),
    },
} as MockApp;

const mockManifest: PluginManifest = {
    id: 'word-frequency',
    name: 'Word Frequency',
    version: '1.1.5',
    minAppVersion: '0.15.0',
    description: 'A plugin to count word frequencies.',
    author: 'Mike Rodarte',
    authorUrl: 'https://example.com',
};

describe('WordFrequencyPlugin', () => {
    let counter = new WordFrequencyCounter();
    let markdownView: MarkdownView;
    let plugin: WordFrequencyPlugin;
    let editor: Editor;

    beforeEach(async () => {
        plugin = new WordFrequencyPlugin(mockApp, mockManifest);
        plugin['app'] = mockApp;
        plugin['loadData'] = jest.fn().mockResolvedValue(DEFAULT_SETTINGS);
        plugin['saveData'] = jest.fn().mockResolvedValue(undefined);
        plugin['registerView'] = jest.fn();
        plugin['addRibbonIcon'] = jest.fn();
        plugin['registerEvent'] = jest.fn();
        plugin['addSettingTab'] = jest.fn();
        markdownView = new (require('obsidian').MarkdownView)();
        editor = {
            getValue: jest.fn().mockReturnValue('hello world hello'),
        } as unknown as Editor;

        markdownView.editor = editor;

        await plugin.onload();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onload', () => {
        it('should load plugin and settings', async () => {
            expect(plugin['loadData']).toHaveBeenCalled();
            expect(plugin['settings']).toEqual(DEFAULT_SETTINGS);
            expect(plugin['registerView']).toHaveBeenCalled();
            expect(plugin['addRibbonIcon']).toHaveBeenCalled();
            expect(plugin['registerEvent']).toHaveBeenCalled();
            expect(plugin['addSettingTab']).toHaveBeenCalled();
            expect(mockApp.workspace.on).toHaveBeenCalled();
        });

        it('should register active-leaf-change event on onload', async () => {
            expect(mockApp.workspace.on).toHaveBeenCalledWith(
                'active-leaf-change',
                expect.any(Function)
            );
        });
    });

    describe('activateView', () => {
        it.skip('should activate view when no leaves exist', async () => {
            mockApp.workspace.getLeavesOfType.mockReturnValue([]);
            mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
            mockApp.workspace.revealLeaf.mockResolvedValue();
            mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

            await plugin.activateView();

            expect(mockApp.workspace.getRightLeaf).toHaveBeenCalled();
            expect(mockApp.workspace.revealLeaf).toHaveBeenCalled();
            expect(mockApp.workspace.getActiveViewOfType).toHaveBeenCalled();
            expect(counter.triggerUpdateContent).toHaveBeenCalledWith(markdownView.editor);
        });

        it.skip('should activate view when leaves exist', async () => {
            mockApp.workspace.getLeavesOfType.mockReturnValue([{ id: 'test' }] as any);
            mockApp.workspace.revealLeaf.mockResolvedValue();
            mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

            const counterMock = {
                calculateWordFrequencies: counter.calculateWordFrequencies,
                triggerUpdateContent: jest.fn(),
            };

            await plugin.activateView();

            expect(mockApp.workspace.revealLeaf).toHaveBeenCalled();
            expect(mockApp.workspace.getActiveViewOfType).toHaveBeenCalled();
            expect(counterMock.triggerUpdateContent).toHaveBeenCalledWith(markdownView.editor);
        });

        it('should handle no right leaf', async () => {
            mockApp.workspace.getLeavesOfType.mockReturnValue([]);
            mockApp.workspace.getRightLeaf.mockReturnValue(null);

            await plugin.activateView();

            expect(mockApp.workspace.getRightLeaf).toHaveBeenCalled();
            expect(mockApp.workspace.setViewState).not.toHaveBeenCalled();
        });
    });

    describe('saveSettings', () => {
        it('should save settings', async () => {
            await plugin.saveSettings();
            expect(plugin['saveData']).toHaveBeenCalledWith(plugin.settings);
        });
    });

    describe('triggerUpdateContent', () => {
        it.skip('should call triggerUpdateContent with active editor', async () => {
            mockApp.workspace.getLeavesOfType.mockReturnValue([]);
            mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
            mockApp.workspace.revealLeaf.mockResolvedValue();
            mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

            counter.triggerUpdateContent = jest.fn();
            await plugin.activateView();

            expect(counter.triggerUpdateContent).toHaveBeenCalledWith(markdownView.editor);
        });

        it.skip('should call triggerUpdateContent with undefined when no active editor', async () => {
            mockApp.workspace.getLeavesOfType.mockReturnValue([]);
            mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
            mockApp.workspace.revealLeaf.mockResolvedValue();
            mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

            counter.triggerUpdateContent = jest.fn();
            await plugin.activateView();

            expect(counter.triggerUpdateContent).toHaveBeenCalledWith(undefined);
        });

        // it.skip('should triggerUpdateContent with lastActiveEditor when defined', async () => {
        //     mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //     mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        //     mockApp.workspace.revealLeaf.mockResolvedValue();
        //     mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //
        //     counter.triggerUpdateContent = jest.fn();
        //     plugin['lastActiveEditor'] = markdownView.editor;
        //     await plugin.activateView();
        //
        //     expect(counter.triggerUpdateContent).toHaveBeenCalledWith(markdownView.editor);
        // });

        // it.skip('should activate view and trigger update content with active markdown view when lastActiveEditor is undefined', async () => {
        //     mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //     mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        //     mockApp.workspace.revealLeaf.mockResolvedValue();
        //     mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //
        //     counter.triggerUpdateContent = jest.fn();
        //     plugin['lastActiveEditor'] = undefined;
        //     await plugin.activateView();
        //
        //     expect(counter.triggerUpdateContent).toHaveBeenCalledWith(markdownView.editor);
        // });

        // it.skip('should triggerUpdateContent with undefined when lastActiveEditor is undefined and active view is not markdown', async () => {
        //     mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //     mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        //     mockApp.workspace.revealLeaf.mockResolvedValue();
        //     mockApp.workspace.getActiveViewOfType.mockReturnValue(null);
        //
        //     counter.triggerUpdateContent = jest.fn();
        //     plugin['lastActiveEditor'] = undefined;
        //     await plugin.activateView();
        //
        //     expect(counter.triggerUpdateContent).toHaveBeenCalledWith(undefined);
        // });

        it.skip('should write an error to the console when an error is thrown', async () => {
            const error = new Error('test error');

            mockApp.workspace.getLeavesOfType.mockReturnValue([]);
            mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
            mockApp.workspace.revealLeaf.mockResolvedValue();
            mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const dispatchEventSpy = jest.spyOn(window.document, 'dispatchEvent');

            try {
                await plugin.activateView();
            } catch (e) {
                // catching to avoid failing
            }

            expect(consoleErrorSpy).toHaveBeenCalledWith('error in triggerUpdateContent', error);
            expect(dispatchEventSpy).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
            dispatchEventSpy.mockRestore();
        });
    });

    describe.skip('refactor these to call the public API', () => {
        // describe('handleActiveLeafChange direct calls', () => {
        //     it('should handle active-leaf-change event with markdown view', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         counter.triggerUpdateContent = jest.fn();
        //         mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(markdownView.containerEl.addEventListener).toHaveBeenCalled();
        //
        //         const keyupCallback = (markdownView.containerEl.addEventListener as jest.Mock).mock.calls[0][1];
        //         keyupCallback();
        //
        //         expect(counter.triggerUpdateContent).toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event without markdown view', () => {
        //         const leaf = { view: {} } as any as WorkspaceLeaf;
        //         plugin['handleActiveLeafChange'](leaf);
        //         expect(markdownView.containerEl.addEventListener).not.toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event with null leaf', () => {
        //         plugin['handleActiveLeafChange'](null);
        //         expect(markdownView.containerEl.addEventListener).not.toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event and update lastActiveEditor', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         counter.triggerUpdateContent = jest.fn();
        //         mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //         mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(markdownView.containerEl.addEventListener).toHaveBeenCalled();
        //         expect(plugin['lastActiveEditor']).toBe(markdownView.editor);
        //
        //         const keyupCallback = (markdownView.containerEl.addEventListener as jest.Mock).mock.calls[0][1];
        //         keyupCallback();
        //
        //         expect(counter.triggerUpdateContent).toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event and not update lastActiveEditor when not a markdown view', () => {
        //         const leaf = { view: {} } as any as WorkspaceLeaf;
        //         plugin['handleActiveLeafChange'](leaf);
        //         expect(plugin['lastActiveEditor']).toBeUndefined();
        //     });
        //
        //     it('should handle active-leaf-change event', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         counter.triggerUpdateContent = jest.fn();
        //         mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //         mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(mockApp.workspace.on).toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event and trigger update content when view is open', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         counter.triggerUpdateContent = jest.fn();
        //         mockApp.workspace.getLeavesOfType.mockReturnValue([{ id: 'test' }] as any);
        //         mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(counter.triggerUpdateContent).toHaveBeenCalled();
        //     });
        //
        //     it('should handle active-leaf-change event and not trigger update content when view is not open', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         counter.triggerUpdateContent = jest.fn();
        //         mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        //         mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(counter.triggerUpdateContent).not.toHaveBeenCalled();
        //     });
        //
        //     it('should trigger handleActiveLeafChange on active-leaf-change', () => {
        //         const leaf = { view: markdownView } as any as WorkspaceLeaf;
        //         const callback = mockApp.workspace.on.mock.calls[0][1];
        //         plugin['handleActiveLeafChange'] = jest.fn();
        //         callback(leaf);
        //         expect(plugin['handleActiveLeafChange']).toHaveBeenCalledWith(leaf);
        //     });
        //
        //     it.skip('should call triggerUpdateContent with lastActiveEditor', () => {
        //         const leaf = {
        //             view: markdownView,
        //         } as unknown as WorkspaceLeaf;
        //
        //         plugin['lastActiveEditor'] = editor;
        //
        //         plugin['handleActiveLeafChange'](leaf);
        //
        //         expect(plugin['lastActiveEditor']).toBe(editor);
        //     });
        //});

        describe('loadSettings direct calls', () => {
            it('should load settings with data', async () => {
                plugin['loadData'] = jest.fn().mockResolvedValue({ blacklist: 'test' });
                await plugin['loadSettings']();
                expect(plugin.settings.blacklist).toBe('test');
            });

            it('should load settings without data', async () => {
                plugin['loadData'] = jest.fn().mockResolvedValue(null);
                await plugin['loadSettings']();
                expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
            });
        });
    });
});