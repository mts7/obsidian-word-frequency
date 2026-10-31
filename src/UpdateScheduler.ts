import {
    Component,
    debounce,
    Debouncer,
    MarkdownView,
    Workspace,
    WorkspaceLeaf,
} from 'obsidian';
import { VIEW_TYPE } from './constants';
import { NoteTracker } from './NoteTracker';

const EDIT_UPDATE_DELAY_MS = 3000;

type EventRegistrar = Pick<Component, 'registerEvent'>;

export class UpdateScheduler {
    private readonly registrar: EventRegistrar;
    private readonly workspace: Workspace;
    private readonly noteTracker: NoteTracker;
    private readonly update: () => void;
    private readonly debouncedUpdate: Debouncer<[], void>;

    constructor(
        registrar: EventRegistrar,
        workspace: Workspace,
        noteTracker: NoteTracker,
        update: () => void
    ) {
        this.registrar = registrar;
        this.workspace = workspace;
        this.noteTracker = noteTracker;
        this.update = update;
        this.debouncedUpdate = debounce(
            () => this.updateIfSidebarOpen(),
            EDIT_UPDATE_DELAY_MS
        );
    }

    registerEvents(): void {
        this.registrar.registerEvent(
            this.workspace.on('active-leaf-change', (leaf) =>
                this.handleActiveLeafChange(leaf)
            )
        );
        this.registrar.registerEvent(
            this.workspace.on('file-open', () => this.updateIfSidebarOpen())
        );
        this.registrar.registerEvent(
            this.workspace.on('editor-change', () => this.debouncedUpdate())
        );
        this.workspace.onLayoutReady(() => this.updateIfSidebarOpen());
    }

    cancelPendingUpdate(): void {
        this.debouncedUpdate.cancel();
    }

    private handleActiveLeafChange(leaf: WorkspaceLeaf | null): void {
        if (!(leaf?.view instanceof MarkdownView)) {
            return;
        }

        this.noteTracker.rememberNote(leaf.view);
        this.updateIfSidebarOpen();
    }

    private updateIfSidebarOpen(): void {
        if (this.workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
            this.update();
        }
    }
}
