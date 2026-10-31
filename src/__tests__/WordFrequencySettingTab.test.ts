import { Setting } from 'obsidian';
import { ELEMENT_CLASSES, SETTINGS_NAMES } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';

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
            app: {},
        } as unknown as WordFrequencyPlugin;

        containerEl = createMockContainerEl();
        settingTab = new WordFrequencySettingTab(plugin);
        settingTab.containerEl = containerEl;
    });

    it('should initialize the constructor correctly', () => {
        expect(settingTab.plugin).toBe(plugin);
    });

    const createMockSetting = () => {
        const textArea = {
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
            inputEl: { classList: { add: jest.fn() } },
        };
        const text = {
            setPlaceholder: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
        };
        const setting = {
            setName: jest.fn().mockReturnThis(),
            setDesc: jest.fn().mockReturnThis(),
            setClass: jest.fn().mockReturnThis(),
            addTextArea: jest.fn().mockImplementation((callback) => {
                callback(textArea);
                return setting;
            }),
            addText: jest.fn().mockImplementation((callback) => {
                callback(text);
                return setting;
            }),
            infoEl: { addClass: jest.fn() },
        };

        return { setting, text, textArea };
    };

    it('should create new settings', async () => {
        const { setting, text, textArea } = createMockSetting();
        const mockSettingFactory = jest.fn().mockReturnValue(setting);
        const settingTab = new WordFrequencySettingTab(
            plugin,
            mockSettingFactory
        );
        settingTab.containerEl = containerEl;
        containerEl.appendChild(document.createElement('span'));
        plugin.settings.blacklist = 'the,and';
        plugin.settings.threshold = 4;
        const saveBlacklistSpy = jest
            .spyOn(settingTab, 'saveBlacklistValue')
            .mockResolvedValue();
        const updateThresholdSpy = jest
            .spyOn(settingTab, 'updateThreshold')
            .mockResolvedValue();

        settingTab.display();
        await textArea.onChange.mock.calls[0][0]('a,b');
        await text.onChange.mock.calls[0][0]('7');

        expect(containerEl.childElementCount).toBe(0);
        expect(mockSettingFactory).toHaveBeenCalledTimes(2);
        expect(setting.setName).toHaveBeenCalledWith(SETTINGS_NAMES.blacklist);
        expect(setting.setName).toHaveBeenCalledWith(SETTINGS_NAMES.threshold);
        expect(setting.infoEl.addClass).toHaveBeenCalledWith(
            ELEMENT_CLASSES.settingInfoItem
        );
        expect(textArea.setValue).toHaveBeenCalledWith('the,and');
        expect(textArea.inputEl.classList.add).toHaveBeenCalledWith(
            ELEMENT_CLASSES.settingBlacklist
        );
        expect(text.setPlaceholder).toHaveBeenCalledWith('3');
        expect(text.setValue).toHaveBeenCalledWith('4');
        expect(saveBlacklistSpy).toHaveBeenCalledWith('a,b');
        expect(updateThresholdSpy).toHaveBeenCalledWith('7');
    });

    it('should use the obsidian Setting by default', () => {
        const { setting } = createMockSetting();
        (Setting as unknown as jest.Mock).mockImplementation(() => setting);

        settingTab.display();

        expect(Setting).toHaveBeenCalledWith(containerEl);
    });

    it('should save blacklist', async () => {
        const value = 'word1,word2';

        await settingTab.saveBlacklistValue(value);

        expect(plugin.settings.blacklist).toBe(value);
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('should save a numeric threshold', async () => {
        await settingTab.updateThreshold('5');

        expect(plugin.settings.threshold).toBe(5);
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('should not save setting', async () => {
        const value = 'asdf';

        await settingTab.updateThreshold(value);

        expect(plugin.saveSettings).not.toHaveBeenCalled();
        expect(plugin.settings.threshold).toBe(0);
    });
});
