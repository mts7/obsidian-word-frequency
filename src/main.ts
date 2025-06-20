import { App, Plugin, PluginManifest, WorkspaceLeaf } from 'obsidian';
import {
    WordFrequencySettings,
    DEFAULT_SETTINGS,
    PLUGIN_NAME,
    VIEW_TYPE,
    FREQUENCY_ICON,
    COMMAND_ID_SHOW_SIDEBAR,
} from './constants';
import { ViewManager } from './ViewManager';
import { WordFrequencyCounter } from './WordFrequencyCounter';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';

export default class WordFrequencyPlugin extends Plugin {
    frequencyCounter: WordFrequencyCounter;
    settings: WordFrequencySettings = DEFAULT_SETTINGS;
    settingTab: WordFrequencySettingTab;
    viewManager: ViewManager;

    constructor(
        app: App,
        manifest: PluginManifest,
        viewManager?: ViewManager,
        settingTab?: WordFrequencySettingTab,
        frequencyCounter?: WordFrequencyCounter,
        /* eslint-disable no-unused-vars */
        private createView: (leaf: WorkspaceLeaf) => WordFrequencyView = (
            leaf
        ) => new WordFrequencyView(leaf, this)
        /* eslint-enable no-unused-vars */
    ) {
        super(app, manifest);
        this.settingTab = settingTab ?? new WordFrequencySettingTab(this);
        this.viewManager = viewManager ?? new ViewManager(this);
        this.frequencyCounter =
            frequencyCounter ?? new WordFrequencyCounter(this);
    }

    async onload() {
        const title = `Show ${PLUGIN_NAME.toLowerCase()} sidebar`;

        await this.loadSettings();

        this.registerView(VIEW_TYPE, this.createView);

        this.addRibbonIcon(FREQUENCY_ICON, title, () => this.activateView());

        this.addCommand({
            id: COMMAND_ID_SHOW_SIDEBAR,
            name: title,
            callback: () => this.activateView(),
        });

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                this.frequencyCounter.handleActiveLeafChange(
                    leaf,
                    this.app.workspace
                );
            })
        );

        this.addSettingTab(this.settingTab);
    }

    onunload() {}

    async activateView() {
        const { workspace } = this.app;

        const leaf = this.viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        if (leaf === null) {
            return;
        }

        await this.viewManager.setViewState(leaf, VIEW_TYPE);

        await workspace.revealLeaf(leaf);

        this.viewManager.updateContent();
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }
}
