import { VIEW_TYPE } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';
import { WordFrequencyView } from '../WordFrequencyView';

const createMockContainerEl = () => {
    const mockContainerEl = document.createElement('div');
    mockContainerEl.empty = function () {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    };

    return mockContainerEl;
};

describe('WordFrequencySettingTab', () => {
    let plugin: WordFrequencyPlugin;
    let settingTab: WordFrequencySettingTab;
    let containerEl: HTMLElement;

    beforeEach(() => {
        plugin = {
            settings: {
                blacklist: '',
                threshold: 0
            },
            saveSettings: jest.fn().mockResolvedValue(undefined),
            app: {
                workspace: {
                    getLeavesOfType: jest.fn().mockReturnValue([{ view: { updateContent: jest.fn() } }])
                }
            }
        } as unknown as WordFrequencyPlugin;

        containerEl = createMockContainerEl();
        settingTab = new WordFrequencySettingTab(plugin);
        settingTab.containerEl = containerEl;
    });

    it('should initialize the constructor correctly', () => {
        expect(settingTab.plugin).toBe(plugin);
    });

    it.todo('should create new settings');

    it('should save blacklist', async () => {
        const value = 'word1,word2';

        await settingTab.saveBlacklistValue(value);

        expect(plugin.settings.blacklist).toBe(value);
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('should save settings and update content', async () => {
        const value = '5';

        await settingTab.updateThreshold(value);

        const view = plugin.app.workspace.getLeavesOfType(VIEW_TYPE)[0] as unknown as {
            view: WordFrequencyView
        };

        expect(plugin.settings.threshold).toBe(5);
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(VIEW_TYPE);
        expect(view.view.updateContent).toHaveBeenCalled();
    });

    it('should not save setting', async () => {
        const value = 'asdf';

        await settingTab.updateThreshold(value);

        expect(plugin.saveSettings).not.toHaveBeenCalled();
        expect(plugin.app.workspace.getLeavesOfType).not.toHaveBeenCalled();
    });
});
