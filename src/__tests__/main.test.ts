import WordFrequencyPlugin from '../main';
import { App, WorkspaceLeaf, PluginManifest, MarkdownView } from 'obsidian';
import { DEFAULT_SETTINGS } from '../constants';

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
    id: "word-frequency",
    name: "Word Frequency",
    version: "1.1.5",
    minAppVersion: "0.15.0",
    description: "A plugin to count word frequencies.",
    author: "Mike Rodarte",
    authorUrl: "https://example.com",
}

describe('WordFrequencyPlugin', () => {
    let markdownView: MarkdownView;
    let plugin: WordFrequencyPlugin;

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

    it('should trigger update content', () => {
        plugin['calculateWordFrequencies'] = jest.fn().mockReturnValue([["test", 1]]);
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
});