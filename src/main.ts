import manifest from '../manifest.json';
import { App, Plugin, WorkspaceLeaf } from 'obsidian';
import { ViewManager } from './ViewManager';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyCounter } from './WordFrequencyCounter';
import { WordFrequencySettings, DEFAULT_SETTINGS, PLUGIN_NAME, VIEW_TYPE, FREQUENCY_ICON } from './constants';
import { WordFrequencyView } from './WordFrequencyView';

export default class WordFrequencyPlugin extends Plugin {
    frequencyCounter: WordFrequencyCounter;
    settings: WordFrequencySettings = DEFAULT_SETTINGS;
    viewManager: ViewManager;

    constructor(app: App, frequencyCounter?: WordFrequencyCounter, viewManager?: ViewManager) {
        super(app, manifest);
        this.frequencyCounter = frequencyCounter ?? new WordFrequencyCounter();
        this.viewManager = viewManager ?? new ViewManager(this);
    }

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

        const leaf = this.viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        if (!leaf) {
            return;
        }

        if (!leaf.view) {
            await this.viewManager.setViewState(leaf, VIEW_TYPE);
        }

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
