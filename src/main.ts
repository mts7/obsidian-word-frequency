import { Plugin, WorkspaceLeaf } from 'obsidian';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';
import { WordFrequencySettings, DEFAULT_SETTINGS, PLUGIN_NAME, VIEW_TYPE, FREQUENCY_ICON } from './constants';
import { WordFrequencyCounter } from './WordFrequencyCounter';
import { ViewManager } from './ViewManager';

export default class WordFrequencyPlugin extends Plugin {
    frequencyCounter: WordFrequencyCounter = new WordFrequencyCounter();
    settings: WordFrequencySettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        // TODO: use dependency injection
        this.registerView(
            VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new WordFrequencyView(leaf, this)
        );

        this.addRibbonIcon(FREQUENCY_ICON, `Show ${PLUGIN_NAME} Sidebar`, () => {
            this.activateView();
        });

        this.registerEvent(
            this.app.workspace.on(
                'active-leaf-change',
                (leaf) => {
                    this.frequencyCounter.handleActiveLeafChange(leaf, this.app.workspace);
                }
            )
        );

        // TODO: use dependency injection
        this.addSettingTab(new WordFrequencySettingTab(this));
    }

    onunload() {
    }

    async activateView() {
        const { workspace } = this.app;
        // TODO: use dependency injection
        const viewManager = new ViewManager(this);

        const leaf = viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        if (leaf === null) {
            return;
        }

        await viewManager.setViewState(leaf, VIEW_TYPE);

        await workspace.revealLeaf(leaf);

        viewManager.updateContent();
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }
}
