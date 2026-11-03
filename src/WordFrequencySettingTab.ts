import { PluginSettingTab, Setting, SettingDefinitionItem } from 'obsidian';
import {
    ELEMENT_CLASSES,
    MINIMUM_SHARE_LIMITS,
    PAGE_SIZE_OPTIONS,
    SETTINGS_DESCRIPTIONS,
    SETTINGS_NAMES,
} from './constants';
import WordFrequencyPlugin from './main';

export class WordFrequencySettingTab extends PluginSettingTab {
    plugin: WordFrequencyPlugin;

    constructor(plugin: WordFrequencyPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                name: SETTINGS_NAMES.blacklist,
                desc: SETTINGS_DESCRIPTIONS.blacklist,
                render: (setting) => this.buildBlacklist(setting),
            },
            {
                name: SETTINGS_NAMES.threshold,
                desc: SETTINGS_DESCRIPTIONS.threshold,
                render: (setting) => this.buildThreshold(setting),
            },
            {
                name: SETTINGS_NAMES.minimumShare,
                desc: SETTINGS_DESCRIPTIONS.minimumShare,
                render: (setting) => this.buildMinimumShare(setting),
            },
            {
                name: SETTINGS_NAMES.pageSize,
                desc: SETTINGS_DESCRIPTIONS.pageSize,
                render: (setting) => this.buildPageSize(setting),
            },
        ];
    }

    buildBlacklist(setting: Setting): void {
        setting
            .setName(SETTINGS_NAMES.blacklist)
            .setDesc(SETTINGS_DESCRIPTIONS.blacklist)
            .setClass(ELEMENT_CLASSES.settingItem)
            .addTextArea((text) => {
                text.setValue(this.plugin.settings.blacklist)
                    .onChange(async (value) => {
                        await this.saveBlacklistValue(value);
                    })
                    .inputEl.classList.add(ELEMENT_CLASSES.settingBlacklist);
            });
        setting.infoEl.addClass(ELEMENT_CLASSES.settingInfoItem);
    }

    buildThreshold(setting: Setting): void {
        setting
            .setName(SETTINGS_NAMES.threshold)
            .setDesc(SETTINGS_DESCRIPTIONS.threshold)
            .addText((text) =>
                text
                    .setPlaceholder('3')
                    .setValue(this.plugin.settings.threshold.toString())
                    .onChange(async (value) => {
                        await this.updateThreshold(value);
                    })
            );
    }

    buildMinimumShare(setting: Setting): void {
        const { max, min, step } = MINIMUM_SHARE_LIMITS;
        setting
            .setName(SETTINGS_NAMES.minimumShare)
            .setDesc(SETTINGS_DESCRIPTIONS.minimumShare)
            .addSlider((slider) =>
                slider
                    .setLimits(min, max, step)
                    .setValue(this.plugin.settings.minimumShare)
                    .onChange(async (value) => {
                        await this.saveMinimumShare(value);
                    })
            );
    }

    buildPageSize(setting: Setting): void {
        const options = Object.fromEntries(
            PAGE_SIZE_OPTIONS.map((size) => [size.toString(), size.toString()])
        );
        setting
            .setName(SETTINGS_NAMES.pageSize)
            .setDesc(SETTINGS_DESCRIPTIONS.pageSize)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(options)
                    .setValue(this.plugin.settings.pageSize.toString())
                    .onChange(async (value) => {
                        await this.savePageSize(value);
                    })
            );
    }

    async saveBlacklistValue(value: string) {
        this.plugin.settings.blacklist = value;
        await this.plugin.saveSettings();
    }

    async saveMinimumShare(value: number) {
        this.plugin.settings.minimumShare = value;
        await this.plugin.saveSettings();
    }

    async savePageSize(value: string) {
        this.plugin.settings.pageSize = parseInt(value, 10);
        await this.plugin.saveSettings();
    }

    async updateThreshold(value: string) {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            return;
        }

        this.plugin.settings.threshold = num;
        await this.plugin.saveSettings();
    }
}
