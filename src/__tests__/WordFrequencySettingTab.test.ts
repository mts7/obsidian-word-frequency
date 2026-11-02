import {
    ELEMENT_CLASSES,
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
