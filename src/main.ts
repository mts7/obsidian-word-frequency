import { App, Plugin, PluginManifest, WorkspaceLeaf } from 'obsidian';
import {
    DEFAULT_SETTINGS,
    PLUGIN_NAME,
    VIEW_TYPE,
    FREQUENCY_ICON,
    COMMAND_ID_SHOW_SIDEBAR,
} from './constants';
import { NoteTracker } from './NoteTracker';
import { WordFrequencySettings } from './types';
import { UpdateScheduler } from './UpdateScheduler';
import { ViewManager } from './ViewManager';
import { WordFrequencyCounter } from './WordFrequencyCounter';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';

export interface PluginDependencies {
    createView: (leaf: WorkspaceLeaf) => WordFrequencyView;
    frequencyCounter: WordFrequencyCounter;
    noteTracker: NoteTracker;
    settingTab: WordFrequencySettingTab;
    updateScheduler: UpdateScheduler;
    viewManager: ViewManager;
}

export default class WordFrequencyPlugin extends Plugin {
    frequencyCounter: WordFrequencyCounter;
    settings: WordFrequencySettings = { ...DEFAULT_SETTINGS };
    settingTab: WordFrequencySettingTab;
    viewManager: ViewManager;
    private readonly createView: (leaf: WorkspaceLeaf) => WordFrequencyView;
    private readonly updateScheduler: UpdateScheduler;

    constructor(
        app: App,
        manifest: PluginManifest,
        dependencies: Partial<PluginDependencies> = {}
    ) {
        super(app, manifest);
        const noteTracker =
            dependencies.noteTracker ?? new NoteTracker(app.workspace);
        this.createView =
            dependencies.createView ??
            ((leaf) => new WordFrequencyView(leaf, this));
        this.frequencyCounter =
            dependencies.frequencyCounter ??
            new WordFrequencyCounter(noteTracker);
        this.settingTab =
            dependencies.settingTab ?? new WordFrequencySettingTab(this);
        this.updateScheduler =
            dependencies.updateScheduler ??
            new UpdateScheduler(this, app.workspace, noteTracker, () =>
                this.frequencyCounter.triggerUpdateContent()
            );
        this.viewManager = dependencies.viewManager ?? new ViewManager();
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

        this.updateScheduler.registerEvents();

        this.addSettingTab(this.settingTab);
    }

    onunload() {
        this.updateScheduler.cancelPendingUpdate();
    }

    async activateView() {
        const { workspace } = this.app;

        const leaf = this.viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        if (leaf === null) {
            return;
        }

        await this.viewManager.setViewState(leaf, VIEW_TYPE);

        await workspace.revealLeaf(leaf);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);

        this.viewManager.refreshViews(this.app.workspace);
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }
}
