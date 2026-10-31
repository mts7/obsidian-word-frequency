import { MarkdownView, Workspace, WorkspaceLeaf } from 'obsidian';
import { EVENT_UPDATE, VIEW_TYPE } from '../../constants';

type Listener = (..._args: unknown[]) => void;
type WordCounts = [string, number][];

export function createNote(content: string): MarkdownView {
    const leaf = {} as WorkspaceLeaf;
    const note = Object.create(MarkdownView.prototype) as MarkdownView;
    Object.assign(note, { editor: { getValue: () => content }, leaf });
    Object.assign(leaf, { view: note });

    return note;
}

export function replaceNoteContent(note: MarkdownView, content: string): void {
    Object.assign(note.editor, { getValue: () => content });
}

export function createUnreadableNote(error: Error): MarkdownView {
    const note = createNote('');
    Object.assign(note.editor, {
        getValue: () => {
            throw error;
        },
    });

    return note;
}

export class FakeWorkspace {
    activeNote: MarkdownView | null = null;
    openNotes: MarkdownView[] = [];
    mostRecentNote: MarkdownView | null = null;
    sidebarLeaves: WorkspaceLeaf[] = [];
    rightLeaf: WorkspaceLeaf | null = null;
    revealedLeaves: WorkspaceLeaf[] = [];
    private readonly listeners = new Map<string, Listener[]>();
    private readonly layoutReadyCallbacks: Listener[] = [];

    getWorkspace(): Workspace {
        return this as unknown as Workspace;
    }

    on(name: string, callback: Listener): { name: string } {
        this.listeners.set(name, [
            ...(this.listeners.get(name) ?? []),
            callback,
        ]);

        return { name };
    }

    onLayoutReady(callback: Listener): void {
        this.layoutReadyCallbacks.push(callback);
    }

    trigger(name: string, ...args: unknown[]): void {
        (this.listeners.get(name) ?? []).forEach((callback) =>
            callback(...args)
        );
    }

    finishLayout(): void {
        this.layoutReadyCallbacks.forEach((callback) => callback());
    }

    openSidebar(leaf: WorkspaceLeaf = {} as WorkspaceLeaf): void {
        this.sidebarLeaves.push(leaf);
    }

    activateNote(note: MarkdownView): void {
        this.openNote(note);
        this.activeNote = note;
        this.mostRecentNote = note;
        this.trigger('active-leaf-change', note.leaf);
        this.trigger('file-open', {});
    }

    activateSidebar(): void {
        this.activeNote = null;
        this.trigger('active-leaf-change', this.sidebarLeaves[0] ?? null);
    }

    openNote(note: MarkdownView): void {
        if (!this.openNotes.includes(note)) {
            this.openNotes.push(note);
        }
    }

    closeNote(note: MarkdownView): void {
        this.openNotes = this.openNotes.filter((openNote) => openNote !== note);
        if (this.activeNote === note) {
            this.activeNote = null;
        }
        if (this.mostRecentNote === note) {
            this.mostRecentNote = this.openNotes.at(-1) ?? null;
        }
    }

    editNote(): void {
        this.trigger('editor-change');
    }

    getActiveViewOfType(): MarkdownView | null {
        return this.activeNote;
    }

    getLeavesOfType(type: string): WorkspaceLeaf[] {
        if (type === VIEW_TYPE) {
            return this.sidebarLeaves;
        }

        return type === 'markdown'
            ? this.openNotes.map((note) => note.leaf)
            : [];
    }

    getMostRecentLeaf(): WorkspaceLeaf | null {
        return this.mostRecentNote?.leaf ?? null;
    }

    getRightLeaf(): WorkspaceLeaf | null {
        return this.rightLeaf;
    }

    async revealLeaf(leaf: WorkspaceLeaf): Promise<void> {
        this.revealedLeaves.push(leaf);
    }
}

export function recordUpdates(): { counts: WordCounts[]; stop(): void } {
    const counts: WordCounts[] = [];
    const saveCounts = (event: Event) =>
        counts.push((event as CustomEvent).detail.wordCounts);
    window.document.addEventListener(EVENT_UPDATE, saveCounts);

    return {
        counts,
        stop: () =>
            window.document.removeEventListener(EVENT_UPDATE, saveCounts),
    };
}
