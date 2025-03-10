import { MarkdownView, Plugin, Workspace, WorkspaceLeaf } from 'obsidian';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';
import { WordFrequencySettings, DEFAULT_SETTINGS, PLUGIN_NAME, VIEW_TYPE, FREQUENCY_ICON } from './constants';
import { WordFrequencyCounter } from './WordFrequencyCounter';

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

        const leaf = this.getOrCreateLeaf(workspace, VIEW_TYPE);

        if (leaf === null) {
            return;
        }

        if (!leaf.view) {
            await this.setViewState(leaf, VIEW_TYPE);
        }

        await leaf.setViewState({
            type: VIEW_TYPE,
            active: true
        });

        await workspace.revealLeaf(leaf);

        this.updateContent();
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private getOrCreateLeaf(workspace: Workspace, viewType: string): WorkspaceLeaf | null {
        const leaves = workspace.getLeavesOfType(viewType);
        if (leaves.length > 0) {
            return leaves[0];
        } else {
            return workspace.getRightLeaf(false);
        }
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }

    private async setViewState(leaf: WorkspaceLeaf, viewType: string): Promise<void> {
        await leaf.setViewState({
            type: viewType,
            active: true
        });
    }

    private updateContent(): void {
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        this.frequencyCounter.triggerUpdateContent(editor);
    }
}
