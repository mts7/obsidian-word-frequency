import { App, WorkspaceLeaf, PluginManifest } from 'obsidian';
import { DEFAULT_SETTINGS, FREQUENCY_ICON, PLUGIN_NAME, VIEW_TYPE } from '../constants';
import WordFrequencyPlugin from '../main';
import { ViewManager } from '../ViewManager';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';

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
    let mockViewManager: ViewManager;

    beforeEach(async () => {
        mockViewManager = {
            getOrCreateLeaf: jest.fn().mockReturnValue(null),
            setViewState: jest.fn(),
            updateContent: jest.fn(),
        } as unknown as ViewManager;

        plugin = new WordFrequencyPlugin(mockApp, mockManifest, mockViewManager);
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
        it('should set the view state and show the leaf with content', async() => {
            const mockLeaf = jest.fn() as unknown as WorkspaceLeaf;
            mockViewManager = {
                getOrCreateLeaf: jest.fn().mockReturnValue(mockLeaf),
                setViewState: jest.fn(),
                updateContent: jest.fn(),
            } as unknown as ViewManager;
            plugin = new WordFrequencyPlugin(mockApp, mockManifest, mockViewManager);
            plugin['app'] = mockApp;

            await plugin.activateView();

            expect(mockViewManager.getOrCreateLeaf).toHaveBeenCalledWith(plugin.app.workspace, VIEW_TYPE);
            expect(mockViewManager.setViewState).toHaveBeenCalledWith(mockLeaf, VIEW_TYPE);
            expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(mockLeaf);
            expect(mockViewManager.updateContent).toHaveBeenCalled();
        });

        it('should not set view state or reveal leaf when there is no leaf', async() => {
            await plugin.activateView();

            expect(mockViewManager.getOrCreateLeaf).toHaveBeenCalledWith(plugin.app.workspace, VIEW_TYPE);
            expect(mockViewManager.setViewState).not.toHaveBeenCalled();
            expect(plugin.app.workspace.revealLeaf).not.toHaveBeenCalled();
            expect(mockViewManager.updateContent).not.toHaveBeenCalled();
        });
    });

    describe('saveSettings', () => {
        it('should save settings', async () => {
            await plugin.saveSettings();
            expect(plugin['saveData']).toHaveBeenCalledWith(plugin.settings);
        });
    });
});
