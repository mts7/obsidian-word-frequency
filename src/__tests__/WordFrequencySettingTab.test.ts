import { SETTINGS_NAMES, VIEW_TYPE } from '../constants';
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

    it('should create new settings', () => {
        const mockSetName = jest.fn().mockReturnThis();
        const mockSetDesc = jest.fn().mockReturnThis();
        const mockSetClass = jest.fn().mockReturnThis();
        const mockAddTextArea = jest.fn().mockImplementation((callback) => {
            callback({
                setValue: jest.fn().mockReturnThis(),
                onChange: jest.fn().mockReturnThis(),
                inputEl: { classList: { add: jest.fn() } },
            });
            return mockSetting;
        });
        const mockAddText = jest.fn().mockImplementation((callback) => {
            callback({
                setPlaceholder: jest.fn().mockReturnThis(),
                setValue: jest.fn().mockReturnThis(),
                onChange: jest.fn(),
            });
            return mockSetting;
        });
        const mockSetting = {
            setName: mockSetName,
            setDesc: mockSetDesc,
            setClass: mockSetClass,
            addTextArea: mockAddTextArea,
            addText: mockAddText,
            infoEl: { addClass: jest.fn() },
        };
        const mockSettingFactory = jest.fn().mockReturnValue(mockSetting);
        const settingTab = new WordFrequencySettingTab(
            plugin,
            mockSettingFactory
        );
        settingTab.containerEl = containerEl;

        settingTab.display();

        expect(mockSettingFactory).toHaveBeenCalledTimes(2);
        expect(mockSetName).toHaveBeenCalledWith(SETTINGS_NAMES.blacklist);
        expect(mockAddTextArea).toHaveBeenCalled();
    });

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
        plugin.app.workspace.getLeavesOfType = jest
            .fn()
            .mockReturnValue(mockLeaves);

        await settingTab.updateThreshold(value);

        expect(plugin.settings.threshold).toBe(5);
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(
            VIEW_TYPE
        );
        expect(plugin.app.workspace.getLeavesOfType).toHaveReturnedWith(
            mockLeaves
        );
        expect(mockView.updateContent).toHaveBeenCalled();
    });

    it('should not save setting', async () => {
        const value = 'asdf';

        await settingTab.updateThreshold(value);

        expect(plugin.saveSettings).not.toHaveBeenCalled();
        expect(plugin.app.workspace.getLeavesOfType).not.toHaveBeenCalled();
    });
});
