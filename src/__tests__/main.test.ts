import { App, WorkspaceLeaf, PluginManifest, Workspace } from 'obsidian';
import {
    DEFAULT_SETTINGS,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { ViewManager } from '../ViewManager';
import { WordFrequencyCounter } from '../WordFrequencyCounter';
import { WordFrequencyView } from '../WordFrequencyView';

interface MockApp extends App {
    workspace: Workspace;
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
    } as unknown as Workspace,
} as MockApp;

const mockManifest: PluginManifest = {
    id: 'word-frequency',
    name: 'Word Frequency',
    version: '1.3.0',
    minAppVersion: '0.15.0',
    description: 'A plugin to count word frequencies.',
    author: 'Mike Rodarte',
    authorUrl: 'https://example.com',
};

describe('WordFrequencyPlugin', () => {
    let plugin: WordFrequencyPlugin;
    const mockView: WordFrequencyView = {} as unknown as WordFrequencyView;
    let mockViewManager: ViewManager;

    beforeEach(async () => {
        mockViewManager = {
            getOrCreateLeaf: jest.fn().mockReturnValue(null),
            setViewState: jest.fn(),
            updateContent: jest.fn(),
        } as unknown as ViewManager;
        const mockCreateView = jest.fn().mockReturnValue(mockView);
        // TODO: provide mocks for the settingTab and frequencyCounter instead of undefined
        plugin = new WordFrequencyPlugin(
            mockApp,
            mockManifest,
            mockViewManager,
            undefined,
            undefined,
            mockCreateView
        );
        plugin['app'] = mockApp;
        plugin['loadData'] = jest.fn().mockResolvedValue({});
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
            await plugin.onload();

            expect(plugin.frequencyCounter).toBeInstanceOf(
                WordFrequencyCounter
            );
            expect(plugin.registerView).toHaveBeenCalledWith(
                VIEW_TYPE,
                expect.any(Function)
            );
            expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
                FREQUENCY_ICON,
                `Show ${PLUGIN_NAME} Sidebar`,
                expect.any(Function)
            );
            expect(plugin.app.workspace.on).toHaveBeenCalledWith(
                'active-leaf-change',
                expect.any(Function)
            );
            expect(plugin.addSettingTab).toHaveBeenCalled();
        });

        it('should set up the plugin and respond to callbacks', async () => {
            const activateViewMock = jest.fn();
            const mockLeafChange = jest.fn();
            plugin['activateView'] = activateViewMock;
            plugin['frequencyCounter'] = {
                handleActiveLeafChange: mockLeafChange,
            } as unknown as WordFrequencyCounter;

            await plugin.onload();

            const ribbonCallback = (plugin.addRibbonIcon as jest.Mock).mock
                .calls[0][2];
            ribbonCallback();
            const eventCallback = (
                plugin.app.workspace.on as jest.Mock
            ).mock.calls.find(([event]) => event === 'active-leaf-change')?.[1];
            const activeLeaf = { id: 'fake-leaf' } as unknown as WorkspaceLeaf;
            eventCallback?.(activeLeaf);
            const viewCallback = (plugin.registerView as jest.Mock).mock
                .calls[0][1];
            const fakeLeaf = {} as unknown as WorkspaceLeaf;
            const view = viewCallback(fakeLeaf);

            expect(activateViewMock).toHaveBeenCalled();
            expect(mockLeafChange).toHaveBeenCalledWith(
                activeLeaf,
                plugin.app.workspace
            );
            expect(view).toBe(mockView);
        });
    });

    describe('activateView', () => {
        it('should set the view state and show the leaf with content', async () => {
            const mockLeaf = jest.fn() as unknown as WorkspaceLeaf;
            mockViewManager = {
                getOrCreateLeaf: jest.fn().mockReturnValue(mockLeaf),
                setViewState: jest.fn(),
                updateContent: jest.fn(),
            } as unknown as ViewManager;
            plugin = new WordFrequencyPlugin(
                mockApp,
                mockManifest,
                mockViewManager
            );
            plugin['app'] = mockApp;

            await plugin.activateView();

            expect(mockViewManager.getOrCreateLeaf).toHaveBeenCalledWith(
                plugin.app.workspace,
                VIEW_TYPE
            );
            expect(mockViewManager.setViewState).toHaveBeenCalledWith(
                mockLeaf,
                VIEW_TYPE
            );
            expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(
                mockLeaf
            );
            expect(mockViewManager.updateContent).toHaveBeenCalled();
        });

        it('should not set view state or reveal leaf when there is no leaf', async () => {
            await plugin.activateView();

            expect(mockViewManager.getOrCreateLeaf).toHaveBeenCalledWith(
                plugin.app.workspace,
                VIEW_TYPE
            );
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

    describe('loadSettings()', () => {
        it('should have default settings with no loaded data', async () => {
            await plugin.onload();

            expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
        });

        it('should merge result from loadData with default settings', async () => {
            const settings = { threshold: 15 };
            plugin.loadData = jest.fn().mockResolvedValue(settings);

            await plugin.onload();

            expect(plugin.settings).toEqual(
                Object.assign({}, DEFAULT_SETTINGS, settings)
            );
        });
    });
});
