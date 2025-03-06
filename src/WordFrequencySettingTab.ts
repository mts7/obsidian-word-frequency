import WordFrequencyPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { WordFrequencyView } from './WordFrequencyView';
import { VIEW_TYPE } from './constants';

export class WordFrequencySettingTab extends PluginSettingTab {
    plugin: WordFrequencyPlugin;

    constructor(app: App, plugin: WordFrequencyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Blacklist')
            .setDesc('Comma-separated list of words to exclude.')
            .addTextArea((text) => {
                text
                    .setValue(this.plugin.settings.blacklist)
                    .onChange(async (value) => {
                        this.plugin.settings.blacklist = value;
                        await this.plugin.saveSettings();
                    })
                    .inputEl.classList.add('word-frequency-setting-blacklist')
            });

        new Setting(containerEl)
            .setName('Word Frequency Threshold')
            .setDesc('Only show words that appear at least this many times.')
            .addText(text => text
                .setPlaceholder('3')
                .setValue(this.plugin.settings.threshold.toString())
                .onChange(async (value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num)) {
                        this.plugin.settings.threshold = num;
                        await this.plugin.saveSettings();
                        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(leaf => {
                            (leaf.view as WordFrequencyView).updateContent();
                        });
                    }
                }));
    }
}
