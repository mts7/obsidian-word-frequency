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
                threshold: 0,
            },
            saveSettings: jest.fn().mockResolvedValue(undefined),
            app: {
                workspace: {
                    getLeavesOfType: jest
                        .fn()
                        .mockReturnValue([
                            { view: { updateContent: jest.fn() } },
                        ]),
                    iterateAllLeaves: jest.fn(),
                },
            },
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
        const mockView = Object.create(WordFrequencyView.prototype);
        mockView.updateContent = jest.fn();
        const mockLeaves = [{ view: mockView }, { view: {} }];

        (plugin.app.workspace.iterateAllLeaves as jest.Mock).mockImplementation(
            (callback) => {
                mockLeaves.forEach((leaf) => {
                    callback(leaf);
                });
            }
        );

        await settingTab.updateThreshold(value);

        expect(plugin.settings.threshold).toBe(5);
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(mockView.updateContent).toHaveBeenCalled();
    });

    it('should not save setting', async () => {
        const value = 'asdf';

        await settingTab.updateThreshold(value);

        expect(plugin.saveSettings).not.toHaveBeenCalled();
        expect(plugin.app.workspace.getLeavesOfType).not.toHaveBeenCalled();
    });
});
