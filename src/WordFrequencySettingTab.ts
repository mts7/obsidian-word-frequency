import WordFrequencyPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

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
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.settings.blacklist)
                    .onChange(async (value) => {
                        this.plugin.settings.blacklist = value;
                        await this.plugin.saveSettings();
                    })
                    .inputEl.classList.add('word-frequency-setting-blacklist')
            );
    }
}
