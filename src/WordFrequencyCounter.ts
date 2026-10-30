import { debounce, Debouncer, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, VIEW_TYPE } from './constants';
import WordFrequencyPlugin from './main';
import { segmentText } from './segmentationUtils';

const EDIT_UPDATE_DELAY_MS = 3000;

export class WordFrequencyCounter {
    plugin: WordFrequencyPlugin;
    private debouncedUpdate: Debouncer<[], void>;
    private noteView: MarkdownView | undefined;

    constructor(
        plugin: WordFrequencyPlugin,
        debouncedUpdate?: Debouncer<[], void>
    ) {
        this.plugin = plugin;
        this.debouncedUpdate =
            debouncedUpdate ??
            debounce(() => this.updateIfSidebarOpen(), EDIT_UPDATE_DELAY_MS);
    }

    calculateWordFrequencies(content: string): [string, number][] {
        if (content.length === 0) {
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

    registerEvents(): void {
        const { workspace } = this.plugin.app;

        this.plugin.registerEvent(
            workspace.on('active-leaf-change', (leaf) =>
                this.handleActiveLeafChange(leaf)
            )
        );
        this.plugin.registerEvent(
            workspace.on('file-open', () => this.updateIfSidebarOpen())
        );
        this.plugin.registerEvent(
            workspace.on('editor-change', () => this.debouncedUpdate())
        );
        workspace.onLayoutReady(() => this.updateIfSidebarOpen());
    }

    handleActiveLeafChange(leaf: WorkspaceLeaf | null): void {
        if (!(leaf?.view instanceof MarkdownView)) {
            return;
        }

        this.noteView = leaf.view;
        this.updateIfSidebarOpen();
    }

    cancelPendingUpdate(): void {
        this.debouncedUpdate.cancel();
    }

    triggerUpdateContent(): void {
        const noteView = this.findNoteView();
        if (noteView === undefined) {
            return;
        }

        try {
            const wordCounts = this.calculateWordFrequencies(
                noteView.editor.getValue()
            );
            window.document.dispatchEvent(
                new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } })
            );
        } catch (error) {
            console.error('error in triggerUpdateContent', error);
        }
    }

    private updateIfSidebarOpen(): void {
        if (this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
            this.triggerUpdateContent();
        }
    }

    private findNoteView(): MarkdownView | undefined {
        const { workspace } = this.plugin.app;

        const activeView = workspace.getActiveViewOfType(MarkdownView);
        if (activeView !== null) {
            this.noteView = activeView;

            return activeView;
        }

        if (this.noteView !== undefined && this.isStillOpen(this.noteView)) {
            return this.noteView;
        }

        const recentView = workspace.getMostRecentLeaf()?.view;

        return recentView instanceof MarkdownView ? recentView : undefined;
    }

    private isStillOpen(view: MarkdownView): boolean {
        return (
            view.leaf.view === view &&
            this.plugin.app.workspace
                .getLeavesOfType('markdown')
                .includes(view.leaf)
        );
    }
}
