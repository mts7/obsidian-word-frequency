import WordFrequencyPlugin from '../main';
import { App, WorkspaceLeaf, PluginManifest, MarkdownView, Editor, EventRef, IconName, OpenViewState, TFile, View, ViewState, WorkspaceContainer, WorkspaceItem } from 'obsidian';
import { DEFAULT_SETTINGS, VIEW_TYPE } from '../constants';
import { WordFrequencyView } from '../WordFrequencyView';

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

    it('should load plugin and settings', async () => {
        expect(plugin['loadData']).toHaveBeenCalled();
        expect(plugin['settings']).toEqual(DEFAULT_SETTINGS);
        expect(plugin['registerView']).toHaveBeenCalled();
        expect(plugin['addRibbonIcon']).toHaveBeenCalled();
        expect(plugin['registerEvent']).toHaveBeenCalled();
        expect(plugin['addSettingTab']).toHaveBeenCalled();
        expect(mockApp.workspace.on).toHaveBeenCalled();
    });

    it.skip('should unload plugin', () => {
        plugin.onunload();
    });

    it('should activate view when no leaves exist', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();

        await plugin.activateView();

        expect(mockApp.workspace.getRightLeaf).toHaveBeenCalled();
        expect(mockApp.workspace.revealLeaf).toHaveBeenCalled();
        expect(mockApp.workspace.getActiveViewOfType).toHaveBeenCalled();
        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should activate view when leaves exist', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([{ id: "test" }] as any);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();

        await plugin.activateView();

        expect(mockApp.workspace.revealLeaf).toHaveBeenCalled();
        expect(mockApp.workspace.getActiveViewOfType).toHaveBeenCalled();
        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should handle no right leaf', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue(null);

        await plugin.activateView();

        expect(mockApp.workspace.getRightLeaf).toHaveBeenCalled();
        expect(mockApp.workspace.setViewState).not.toHaveBeenCalled();
    });

    it('should call triggerUpdateContent with active editor', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should call triggerUpdateContent with undefined when no active editor', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

        plugin['triggerUpdateContent'] = jest.fn();
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(undefined);
    });

    it('should handle active-leaf-change event with markdown view', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        plugin['triggerUpdateContent'] = jest.fn();
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        plugin['handleActiveLeafChange'](leaf);

        expect(markdownView.containerEl.addEventListener).toHaveBeenCalled();

        const keyupCallback = (markdownView.containerEl.addEventListener as jest.Mock).mock.calls[0][1];
        keyupCallback();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalled();
    });

    it('should handle active-leaf-change event without markdown view', () => {
        const leaf = { view: {} } as any as WorkspaceLeaf;
        plugin['handleActiveLeafChange'](leaf);
        expect(markdownView.containerEl.addEventListener).not.toHaveBeenCalled();
    });

    it('should handle active-leaf-change event with null leaf', () => {
        plugin['handleActiveLeafChange'](null);
        expect(markdownView.containerEl.addEventListener).not.toHaveBeenCalled();
    });

    it('should calculate word frequencies', () => {
        const content = "hello world hello";
        const result = plugin['calculateWordFrequencies'](content);
        expect(result).toEqual([["hello", 2], ["world", 1]]);
    });

    it('should calculate word frequencies with punctuation and mixed case', () => {
        const content = "Hello, world! hello. World?";
        const result = plugin['calculateWordFrequencies'](content);
        expect(result).toEqual([["hello", 2], ["world", 2]]);
    });

    it('should calculate word frequencies with numbers and special characters', () => {
        const content = "word1 word2 123 word1 #$% hello. hello.";
        const result = plugin['calculateWordFrequencies'](content);
        expect(result).toEqual([["word1", 2], ["hello", 2], ["word2", 1], ["123", 1]]);
    });

    it('should calculate word frequencies with periods, colons, and slashes', () => {
        const content = "test. test: test/ test.";
        const result = plugin['calculateWordFrequencies'](content);
        expect(result).toEqual([["test", 4]]);
    });

    it('should trigger update content', () => {
        plugin['calculateWordFrequencies'] = jest.fn().mockReturnValue([['test', 1]]);
        const dispatchEventMock = jest.spyOn(window.document, 'dispatchEvent');
        plugin['triggerUpdateContent'](markdownView.editor);
        expect(dispatchEventMock).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    it('should not trigger update content if editor is undefined', () => {
        const dispatchEventMock = jest.spyOn(window.document, 'dispatchEvent');
        plugin['triggerUpdateContent'](undefined);
        expect(dispatchEventMock).not.toHaveBeenCalled();
        dispatchEventMock.mockRestore();
    });

    it('should handle active-leaf-change event and update lastActiveEditor', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        plugin['triggerUpdateContent'] = jest.fn();
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView); // Add this line
        plugin['handleActiveLeafChange'](leaf);

        expect(markdownView.containerEl.addEventListener).toHaveBeenCalled();
        expect(plugin['lastActiveEditor']).toBe(markdownView.editor);

        const keyupCallback = (markdownView.containerEl.addEventListener as jest.Mock).mock.calls[0][1];
        keyupCallback();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalled();
    });

    it('should handle active-leaf-change event and not update lastActiveEditor when not a markdown view', () => {
        const leaf = { view: {} } as any as WorkspaceLeaf;
        plugin['handleActiveLeafChange'](leaf);
        expect(plugin['lastActiveEditor']).toBeUndefined();
    });

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

    it('should save settings', async () => {
        await plugin.saveSettings();
        expect(plugin['saveData']).toHaveBeenCalledWith(plugin.settings);
    });

    it('should handle active-leaf-change event', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        plugin['triggerUpdateContent'] = jest.fn();
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        plugin['handleActiveLeafChange'](leaf);

        expect(mockApp.workspace.on).toHaveBeenCalled();
    });

    it('should activate view and trigger update content with active markdown view', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should activate view and trigger update content with undefined active markdown view', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

        plugin['triggerUpdateContent'] = jest.fn();
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(undefined);
    });

    it('should handle active-leaf-change event and trigger update content when view is open', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        plugin['triggerUpdateContent'] = jest.fn();
        mockApp.workspace.getLeavesOfType.mockReturnValue([{ id: "test" }] as any);
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        plugin['handleActiveLeafChange'](leaf);

        expect(plugin['triggerUpdateContent']).toHaveBeenCalled();
    });

    it('should handle active-leaf-change event and not trigger update content when view is not open', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        plugin['triggerUpdateContent'] = jest.fn();
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);
        plugin['handleActiveLeafChange'](leaf);

        expect(plugin['triggerUpdateContent']).not.toHaveBeenCalled();
    });

    it('should register active-leaf-change event on onload', async () => {
        expect(mockApp.workspace.on).toHaveBeenCalledWith(
            'active-leaf-change',
            expect.any(Function)
        );
    });

    it('should activate view and trigger update content with active markdown view when lastActiveEditor is undefined', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();
        plugin['lastActiveEditor'] = undefined;
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should trigger handleActiveLeafChange on active-leaf-change', () => {
        const leaf = { view: markdownView } as any as WorkspaceLeaf;
        const callback = mockApp.workspace.on.mock.calls[0][1];
        plugin['handleActiveLeafChange'] = jest.fn();
        callback(leaf);
        expect(plugin['handleActiveLeafChange']).toHaveBeenCalledWith(leaf);
    });

    it('should triggerUpdateContent with lastActiveEditor when defined', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();
        plugin['lastActiveEditor'] = markdownView.editor;
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
    });

    it('should triggerUpdateContent with undefined when lastActiveEditor is undefined and active view is not markdown', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();
        mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

        plugin['triggerUpdateContent'] = jest.fn();
        plugin['lastActiveEditor'] = undefined;
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(undefined);
    });

    it('should triggerUpdateContent with active markdown view when lastActiveEditor is undefined and active view is markdown', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();

        const getActiveViewOfTypeSpy = jest.spyOn(mockApp.workspace, 'getActiveViewOfType');
        getActiveViewOfTypeSpy.mockReturnValue(markdownView);

        plugin['triggerUpdateContent'] = jest.fn();
        plugin['lastActiveEditor'] = undefined;
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(markdownView.editor);
        getActiveViewOfTypeSpy.mockRestore();
    });

    it('should triggerUpdateContent with undefined when lastActiveEditor is undefined and active view is not markdown', async () => {
        mockApp.workspace.getLeavesOfType.mockReturnValue([]);
        mockApp.workspace.getRightLeaf.mockReturnValue({ setViewState: jest.fn().mockResolvedValue({}), } as any as WorkspaceLeaf);
        mockApp.workspace.revealLeaf.mockResolvedValue();

        const getActiveViewOfTypeSpy = jest.spyOn(mockApp.workspace, 'getActiveViewOfType');
        getActiveViewOfTypeSpy.mockReturnValue(null);

        plugin['triggerUpdateContent'] = jest.fn();
        plugin['lastActiveEditor'] = undefined;
        await plugin.activateView();

        expect(plugin['triggerUpdateContent']).toHaveBeenCalledWith(undefined);
        getActiveViewOfTypeSpy.mockRestore();
    });

    it('should call triggerUpdateContent with lastActiveEditor', () => {
        const leaf = {
            view: markdownView,
        } as unknown as WorkspaceLeaf;

        plugin['lastActiveEditor'] = editor;

        plugin['handleActiveLeafChange'](leaf);

        expect(plugin['lastActiveEditor']).toBe(editor);
    });

    it('should handle undefined editor in triggerUpdateContent', () => {
        const triggerUpdateContentSpy = jest.spyOn(plugin, 'triggerUpdateContent' as any);
        plugin['triggerUpdateContent'](undefined);

        expect(triggerUpdateContentSpy).not.toThrow();
    });

    it('should return an empty array when given an empty string', () => {
        const result = plugin['calculateWordFrequencies']('');
        expect(result).toEqual([]);
    });

    it('should write an error to the console when an error is thrown', async () => {
        const error = new Error('test error');
        plugin['calculateWordFrequencies'] = jest.fn().mockImplementation(() => {
            throw error;
        });

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