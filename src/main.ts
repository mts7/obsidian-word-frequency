import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { WordFrequencyView } from './WordFrequencyView';
import { WordFrequencySettings, DEFAULT_SETTINGS, EVENT_UPDATE, PLUGIN_NAME, VIEW_TYPE } from './constants';
import { debounce } from './utils';

export default class WordFrequencyPlugin extends Plugin {
    settings: WordFrequencySettings = DEFAULT_SETTINGS;
    private lastActiveEditor: Editor | undefined;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new WordFrequencyView(leaf, this)
        );

        this.addRibbonIcon('case-lower', PLUGIN_NAME, () => {
            this.activateView();
        });

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                this.handleActiveLeafChange(leaf);
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

        this.triggerUpdateContent(
            this.lastActiveEditor ?? this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
        );
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private calculateWordFrequencies(content: string): [string, number][] {
        if (content.length === 0) {
            return [];
        }

        const wordCounts = new Map<string, number>();
        const words = content
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/);

        words.forEach((word) => {
            if (word) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        });

        return Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
    }

    private handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
        if (leaf === null) {
            return;
        }

        if (!(leaf.view instanceof MarkdownView)) {
            return;
        }

        const view = leaf.view;
        const editor = view.editor;

        const debouncedMethod = debounce(
            () => this.triggerUpdateContent(editor),
            3000
        );

        view.containerEl.addEventListener('keyup', () => {
            debouncedMethod();
        });

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            this.lastActiveEditor = activeView.editor;
        }
        if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
            this.triggerUpdateContent(this.lastActiveEditor);
        }
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
    }

    private triggerUpdateContent(editor?: Editor) {
        if (editor === undefined) {
            return;
        }
        try {
            const wordCounts = this.calculateWordFrequencies(editor.getValue());
            window.document.dispatchEvent(new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } }));
        } catch (error) {
            console.error('error in triggerUpdateContent', error);
        }
    }
}
