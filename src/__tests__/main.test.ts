import WordFrequencyPlugin from '../main';
import { App, WorkspaceLeaf, PluginManifest, MarkdownView, Editor, EventRef } from 'obsidian';
import { DEFAULT_SETTINGS, FREQUENCY_ICON, PLUGIN_NAME, VIEW_TYPE } from '../constants';
import { WordFrequencyCounter } from '../WordFrequencyCounter';
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

describe('WordFrequencyPlugin', () => {
    let counter = new WordFrequencyCounter();
    let markdownView: MarkdownView;
    let plugin: WordFrequencyPlugin;
    let editor: Editor;

    beforeEach(async () => {
        plugin = new WordFrequencyPlugin(mockApp);
        plugin['app'] = mockApp;
        plugin['loadData'] = jest.fn().mockResolvedValue(DEFAULT_SETTINGS);
        plugin['saveData'] = jest.fn().mockResolvedValue(undefined);
        plugin['registerView'] = jest.fn();
        plugin['addRibbonIcon'] = jest.fn();
        plugin['registerEvent'] = jest.fn();
        plugin['addSettingTab'] = jest.fn();
        //     markdownView = new (require('obsidian').MarkdownView)();
        //     editor = {
        //         getValue: jest.fn().mockReturnValue('hello world hello'),
        //     } as unknown as Editor;
        //
        //     markdownView.editor = editor;
        //
        //     await plugin.onload();
    });
    //
    // afterEach(() => {
    //     jest.clearAllMocks();
    // });
    //
    // describe('onload', () => {
    //     it('should load plugin and settings', async () => {
    //         expect(plugin['loadData']).toHaveBeenCalled();
    //         expect(plugin['settings']).toEqual(DEFAULT_SETTINGS);
    //         expect(plugin['registerView']).toHaveBeenCalled();
    //         expect(plugin['addRibbonIcon']).toHaveBeenCalled();
    //         expect(plugin['registerEvent']).toHaveBeenCalled();
    //         expect(plugin['addSettingTab']).toHaveBeenCalled();
    //         expect(mockApp.workspace.on).toHaveBeenCalled();
    //     });
    //
    //     it('should register active-leaf-change event on onload', async () => {
    //         expect(mockApp.workspace.on).toHaveBeenCalledWith(
    //             'active-leaf-change',
    //             expect.any(Function)
    //         );
    //     });
    // });
    //
    // describe('activateView', () => {
    //     it('should handle no right leaf', async () => {
    //         mockApp.workspace.getLeavesOfType.mockReturnValue([]);
    //         mockApp.workspace.getRightLeaf.mockReturnValue(null);
    //
    //         await plugin.activateView();
    //
    //         expect(mockApp.workspace.getRightLeaf).toHaveBeenCalled();
    //         expect(mockApp.workspace.setViewState).not.toHaveBeenCalled();
    //     });
    // });
    //
    describe('saveSettings', () => {
        it('should save settings', async () => {
            await plugin.saveSettings();
            expect(plugin['saveData']).toHaveBeenCalledWith(plugin.settings);
        });
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
});