import { PluginSettingTab, Setting } from 'obsidian';
import {
    ELEMENT_CLASSES,
    SettingFactory,
    SETTINGS_DESCRIPTIONS,
    SETTINGS_NAMES,
    VIEW_TYPE,
} from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyView } from './WordFrequencyView';

export class WordFrequencySettingTab extends PluginSettingTab {
    plugin: WordFrequencyPlugin;
    private settingFactory: SettingFactory;

    constructor(
        plugin: WordFrequencyPlugin,
        settingFactory: SettingFactory = (element) => new Setting(element)
    ) {
        super(plugin.app, plugin);
        this.plugin = plugin;
        this.settingFactory = settingFactory;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const blacklist = this.settingFactory(containerEl)
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
        blacklist.infoEl.addClass(ELEMENT_CLASSES.settingInfoItem);

        this.settingFactory(containerEl)
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

    async saveBlacklistValue(value: string) {
        this.plugin.settings.blacklist = value;
        await this.plugin.saveSettings();
    }

    async updateThreshold(value: string) {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            return;
        }

        this.plugin.settings.threshold = num;
        await this.plugin.saveSettings();

        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
            if (leaf.view instanceof WordFrequencyView) {
                leaf.view.updateContent();
            }
        });
    }
}
