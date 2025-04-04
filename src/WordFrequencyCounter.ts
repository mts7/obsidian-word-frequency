import {
    debounce,
    Editor,
    MarkdownView,
    Workspace,
    WorkspaceLeaf,
} from 'obsidian';
import { EVENT_UPDATE, VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';

export class WordFrequencyCounter {
    lastActiveEditor: Editor | undefined;
    plugin: WordFrequencyPlugin;

    constructor(plugin: WordFrequencyPlugin) {
        this.plugin = plugin;
    }

    calculateWordFrequencies(content: string): [string, number][] {
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

    handleActiveLeafChange(
        leaf: WorkspaceLeaf | null,
        workspace: Workspace
    ): void {
        if (leaf === null) {
            return;
        }

        if (!(leaf.view instanceof MarkdownView)) {
            return;
        }

        const debouncedMethod = debounce(
            (editor: Editor) => this.triggerUpdateContent(editor),
            3000
        );

        this.plugin.registerEvent(
            workspace.on('editor-change', (editor) => debouncedMethod(editor))
        );

        const activeView = workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            this.lastActiveEditor = activeView.editor;
        }
        if (workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
            this.triggerUpdateContent(this.lastActiveEditor);
        }
    }

    triggerUpdateContent(editor?: Editor) {
        if (editor === undefined) {
            if (this.lastActiveEditor === undefined) {
                return;
            }
            editor = this.lastActiveEditor;
        }
        try {
            const wordCounts = this.calculateWordFrequencies(editor.getValue());
            window.document.dispatchEvent(
                new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } })
            );
        } catch (error) {
            console.error('error in triggerUpdateContent', error);
        }
    }
}
