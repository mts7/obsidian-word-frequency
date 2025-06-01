import {
    debounce,
    Editor,
    MarkdownView,
    Workspace,
    WorkspaceLeaf,
} from 'obsidian';
import { EVENT_UPDATE, VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';
import { segmentText } from './segmentationUtils';

export class WordFrequencyCounter {
    lastActiveEditor: Editor | undefined;
    plugin: WordFrequencyPlugin;

    constructor(
        plugin: WordFrequencyPlugin,
        /* eslint-disable no-unused-vars */
        private debouncedEditorChange = debounce(
            (editor: Editor) => this.triggerUpdateContent(editor),
            3000
        )
        /* eslint-enable no-unused-vars */
    ) {
        this.plugin = plugin;
    }

    calculateWordFrequencies(content: string): [string, number][] {
        if (!content) {
            return [];
        }

        const words = segmentText(content);

        const wordCounts = new Map<string, number>();
        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }

        return Array.from(wordCounts.entries()).sort(
            ([, countA], [, countB]) => countB - countA
        );
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

        this.plugin.registerEvent(
            workspace.on('editor-change', (editor) =>
                this.debouncedEditorChange(editor)
            )
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
