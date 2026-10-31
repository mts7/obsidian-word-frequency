import { MarkdownView, Workspace } from 'obsidian';

export class NoteTracker {
    private readonly workspace: Workspace;
    private rememberedNote: MarkdownView | undefined;

    constructor(workspace: Workspace) {
        this.workspace = workspace;
    }

    rememberNote(note: MarkdownView): void {
        this.rememberedNote = note;
    }

    findCurrentNote(): MarkdownView | undefined {
        const activeNote = this.workspace.getActiveViewOfType(MarkdownView);
        if (activeNote !== null) {
            this.rememberedNote = activeNote;

            return activeNote;
        }

        if (
            this.rememberedNote !== undefined &&
            this.isStillOpen(this.rememberedNote)
        ) {
            return this.rememberedNote;
        }

        const recentView = this.workspace.getMostRecentLeaf()?.view;

        return recentView instanceof MarkdownView ? recentView : undefined;
    }

    private isStillOpen(note: MarkdownView): boolean {
        return (
            note.leaf.view === note &&
            this.workspace.getLeavesOfType('markdown').includes(note.leaf)
        );
    }
}
