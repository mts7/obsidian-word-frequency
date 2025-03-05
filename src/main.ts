import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { WordFrequencySettingTab } from './WordFrequencySettingTab';
import { EVENT_UPDATE, PLUGIN_NAME, VIEW_TYPE, WordFrequencyView } from './WordFrequencyView';
import { debounce } from './utils';

interface WordFrequencySettings {
    blacklist: string;
}

const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
};

export default class WordFrequencyPlugin extends Plugin {
    lastActiveEditor: Editor | undefined;
    settings: WordFrequencySettings = DEFAULT_SETTINGS;

    async onload() {
        console.log('Word Frequency Plugin loaded');
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new WordFrequencyView(leaf, this)
        );

        // TODO: the ribbon icon is on the left, and I want it on the right
        this.addRibbonIcon('case-lower', PLUGIN_NAME, () => {
            this.activateView();
        });

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
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
            })
        );

        this.addSettingTab(new WordFrequencySettingTab(this.app, this));
    }

    onunload() {
        console.log('Word Frequency Plugin unloaded');
    }

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

    calculateWordFrequencies(content: string): [string, number][] {
        const wordCounts = new Map<string, number>();
        const words = content
            .toLowerCase()
            .replace(/[^a-z0-9\s:\/.]/g, '')
            .split(/\s+/);

        words.forEach((word) => {
            if (word) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        });

        return Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    triggerUpdateContent(editor?: Editor) {
        if (editor === undefined) {
            return;
        }
        const wordCounts = this.calculateWordFrequencies(editor.getValue());
        window.document.dispatchEvent(new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } }));
    }
}
