import { MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';
import { WordFrequencySettings, DEFAULT_SETTINGS, PLUGIN_NAME, VIEW_TYPE, FREQUENCY_ICON } from './constants';
import { WordFrequencyCounter } from './WordFrequencyCounter';

export default class WordFrequencyPlugin extends Plugin {
    frequencyCounter: WordFrequencyCounter = new WordFrequencyCounter();
    settings: WordFrequencySettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new WordFrequencyView(leaf, this)
        );

        this.addRibbonIcon(FREQUENCY_ICON, `Show ${PLUGIN_NAME} Sidebar`, () => {
            this.activateView();
        });

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                this.frequencyCounter.handleActiveLeafChange(leaf, this.app.workspace);
            })
        );

        this.addSettingTab(new WordFrequencySettingTab(this.app, this));
    }

    onunload() {}

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf === null) {
                return;
            }

            await leaf.setViewState({
                type: VIEW_TYPE,
                active: true
            });
        }

        await workspace.revealLeaf(leaf);

        this.frequencyCounter.triggerUpdateContent(this.app.workspace.getActiveViewOfType(MarkdownView)?.editor);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }
}
