import {
    ELEMENT_CLASSES,
    MINIMUM_SHARE_LIMITS,
    SETTINGS_DESCRIPTIONS,
    SETTINGS_NAMES,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';

describe('WordFrequencySettingTab', () => {
    let plugin: WordFrequencyPlugin;
    let settingTab: WordFrequencySettingTab;

    beforeEach(() => {
        plugin = {
            settings: {
                blacklist: '',
                minimumShare: 0,
                pageSize: 15,
                threshold: 0,
            },
            saveSettings: jest.fn().mockResolvedValue(undefined),
            app: {},
        } as unknown as WordFrequencyPlugin;

        settingTab = new WordFrequencySettingTab(plugin);
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
        const slider = {
            setLimits: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
        };
        const dropdown = {
            addOptions: jest.fn().mockReturnThis(),
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
            addSlider: jest.fn().mockImplementation((callback) => {
                callback(slider);
                return setting;
            }),
            addDropdown: jest.fn().mockImplementation((callback) => {
                callback(dropdown);
                return setting;
            }),
            infoEl: { addClass: jest.fn() },
        };

        return { dropdown, setting, slider, text, textArea };
    };

    it('should define searchable settings with names and descriptions', () => {
        const definitions = settingTab.getSettingDefinitions();

        expect(definitions).toEqual([
            expect.objectContaining({
                name: SETTINGS_NAMES.blacklist,
                desc: SETTINGS_DESCRIPTIONS.blacklist,
            }),
            expect.objectContaining({
                name: SETTINGS_NAMES.threshold,
                desc: SETTINGS_DESCRIPTIONS.threshold,
            }),
            expect.objectContaining({
                name: SETTINGS_NAMES.minimumShare,
                desc: SETTINGS_DESCRIPTIONS.minimumShare,
            }),
            expect.objectContaining({
                name: SETTINGS_NAMES.pageSize,
                desc: SETTINGS_DESCRIPTIONS.pageSize,
            }),
        ]);
    });

    it('should render the defined settings', async () => {
        const { setting, text, textArea } = createMockSetting();
        plugin.settings.blacklist = 'the,and';
        plugin.settings.threshold = 4;
        const saveBlacklistSpy = jest
            .spyOn(settingTab, 'saveBlacklistValue')
            .mockResolvedValue();
        const updateThresholdSpy = jest
            .spyOn(settingTab, 'updateThreshold')
            .mockResolvedValue();
        const [blacklist, threshold] =
            settingTab.getSettingDefinitions() as unknown as {
                render: (_setting: unknown) => void;
            }[];

        blacklist.render(setting);
        threshold.render(setting);
        await textArea.onChange.mock.calls[0][0]('a,b');
        await text.onChange.mock.calls[0][0]('7');

        expect(setting.setClass).toHaveBeenCalledWith(
            ELEMENT_CLASSES.settingItem
        );
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

    it('should render the minimum share as a slider', async () => {
        const { setting, slider } = createMockSetting();
        plugin.settings.minimumShare = 30;
        const saveMinimumShareSpy = jest
            .spyOn(settingTab, 'saveMinimumShare')
            .mockResolvedValue();
        const minimumShare = (
            settingTab.getSettingDefinitions() as unknown as {
                render: (_setting: unknown) => void;
            }[]
        )[2];

        minimumShare.render(setting);
        await slider.onChange.mock.calls[0][0](60);

        expect(setting.setName).toHaveBeenCalledWith(
            SETTINGS_NAMES.minimumShare
        );
        expect(setting.setDesc).toHaveBeenCalledWith(
            SETTINGS_DESCRIPTIONS.minimumShare
        );
        expect(slider.setLimits).toHaveBeenCalledWith(
            MINIMUM_SHARE_LIMITS.min,
            MINIMUM_SHARE_LIMITS.max,
            MINIMUM_SHARE_LIMITS.step
        );
        expect(slider.setValue).toHaveBeenCalledWith(30);
        expect(saveMinimumShareSpy).toHaveBeenCalledWith(60);
    });

    it('should save the minimum share', async () => {
        await settingTab.saveMinimumShare(60);

        expect(plugin.settings.minimumShare).toBe(60);
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('should render the words at a time as a dropdown', async () => {
        const { dropdown, setting } = createMockSetting();
        plugin.settings.pageSize = 50;
        const savePageSizeSpy = jest
            .spyOn(settingTab, 'savePageSize')
            .mockResolvedValue();
        const pageSize = (
            settingTab.getSettingDefinitions() as unknown as {
                render: (_setting: unknown) => void;
            }[]
        )[3];

        pageSize.render(setting);
        await dropdown.onChange.mock.calls[0][0]('100');

        expect(setting.setName).toHaveBeenCalledWith(SETTINGS_NAMES.pageSize);
        expect(setting.setDesc).toHaveBeenCalledWith(
            SETTINGS_DESCRIPTIONS.pageSize
        );
        expect(dropdown.addOptions).toHaveBeenCalledWith({
            15: '15',
            50: '50',
            100: '100',
        });
        expect(dropdown.setValue).toHaveBeenCalledWith('50');
        expect(savePageSizeSpy).toHaveBeenCalledWith('100');
    });

    it('should save the words at a time as a number', async () => {
        await settingTab.savePageSize('100');

        expect(plugin.settings.pageSize).toBe(100);
        expect(plugin.saveSettings).toHaveBeenCalled();
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
