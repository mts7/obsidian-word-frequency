import { PluginSettingTab, Setting } from 'obsidian';
import { VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';
import { WordFrequencyView } from './WordFrequencyView';

export class WordFrequencySettingTab extends PluginSettingTab {
    plugin: WordFrequencyPlugin;

    constructor(plugin: WordFrequencyPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Blacklist')
            .setDesc('Comma-separated list of words to exclude.')
            .addTextArea((text) => {
                text.setValue(this.plugin.settings.blacklist)
                    .onChange(async (value) => {
                        await this.saveBlacklistValue(value);
                    })
                    .inputEl.classList.add('word-frequency-setting-blacklist');
            });

        new Setting(containerEl)
            .setName('Word frequency threshold')
            .setDesc('Only show words that appear at least this many times.')
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
            (leaf.view as WordFrequencyView).updateContent();
        });
    }
}
