import WordFrequencyPlugin from '../main';
import { App, WorkspaceLeaf, PluginManifest, MarkdownView, Editor, EventRef } from 'obsidian';
import { DEFAULT_SETTINGS, FREQUENCY_ICON, PLUGIN_NAME, VIEW_TYPE } from '../constants';
import { WordFrequencyCounter } from '../WordFrequencyCounter';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';
import { ViewManager } from '../ViewManager';

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
        on: jest.fn((event, callback) => {
            return callback;
        }),
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
    version: '1.2.0',
    minAppVersion: '0.15.0',
    description: 'A plugin to count word frequencies.',
    author: 'Mike Rodarte',
    authorUrl: 'https://example.com',
};

describe('WordFrequencyPlugin', () => {
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onload', () => {
        it('should set up the plugin', async () => {
            const settingTab = new WordFrequencySettingTab(plugin);

            await plugin.onload();

            expect(plugin.registerView).toHaveBeenCalledWith(VIEW_TYPE, expect.any(Function));
            expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
                FREQUENCY_ICON,
                `Show ${PLUGIN_NAME} Sidebar`,
                expect.any(Function)
            );
            expect(plugin.app.workspace.on).toHaveBeenCalledWith('active-leaf-change', expect.any(Function));
            expect(plugin.addSettingTab).toHaveBeenCalledWith(settingTab);
        });
    });

    describe('activateView', () => {
        it.todo('should set the view state and show the leaf with content');

        it.skip('should not set view state or reveal leaf when there is no leaf', async() => {
            // TODO: mock viewManager.getOrCreateLeaf to return null
            const mockViewManager = {
                getOrCreateLeaf: jest.fn().mockReturnValue(null),
                setViewState: jest.fn(),
                updateContent: jest.fn(),
            } as unknown as ViewManager;

            const newPlugin = new WordFrequencyPlugin(mockApp, mockManifest, mockViewManager);

            await newPlugin.activateView();
        });
    });

    describe('saveSettings', () => {
        it('should save settings', async () => {
            await plugin.saveSettings();
            expect(plugin['saveData']).toHaveBeenCalledWith(plugin.settings);
        });
    });
});