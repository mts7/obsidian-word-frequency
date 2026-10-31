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
const NOTE_SWITCH_DELAY_MS = 0;

type EventRegistrar = Pick<Component, 'registerEvent'>;

export class UpdateScheduler {
    private readonly registrar: EventRegistrar;
    private readonly workspace: Workspace;
    private readonly noteTracker: NoteTracker;
    private readonly update: () => void;
    private readonly editUpdate: Debouncer<[], void>;
    private readonly switchUpdate: Debouncer<[], void>;
    private hasSkippedUpdate = false;

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
        this.editUpdate = debounce(
            () => this.updateIfSidebarVisible(),
            EDIT_UPDATE_DELAY_MS
        );
        this.switchUpdate = debounce(
            () => this.updateIfSidebarVisible(),
            NOTE_SWITCH_DELAY_MS
        );
    }

    registerEvents(): void {
        this.registrar.registerEvent(
            this.workspace.on('active-leaf-change', (leaf) =>
                this.handleActiveLeafChange(leaf)
            )
        );
        this.registrar.registerEvent(
            this.workspace.on('file-open', () => this.switchUpdate())
        );
        this.registrar.registerEvent(
            this.workspace.on('editor-change', () => this.editUpdate())
        );
        this.registrar.registerEvent(
            this.workspace.on('layout-change', () => this.updateIfSkipped())
        );
        this.workspace.onLayoutReady(() => this.updateIfSidebarVisible());
    }

    cancelPendingUpdate(): void {
        this.editUpdate.cancel();
        this.switchUpdate.cancel();
    }

    private handleActiveLeafChange(leaf: WorkspaceLeaf | null): void {
        if (!(leaf?.view instanceof MarkdownView)) {
            this.updateIfSkipped();

            return;
        }

        this.noteTracker.rememberNote(leaf.view);
        this.switchUpdate();
    }

    private updateIfSkipped(): void {
        if (this.hasSkippedUpdate) {
            this.switchUpdate();
        }
    }

    private updateIfSidebarVisible(): void {
        const isVisible = this.isSidebarVisible();
        this.hasSkippedUpdate = !isVisible && this.isSidebarOpen();
        if (isVisible) {
            this.update();
        }
    }

    private isSidebarOpen(): boolean {
        return this.workspace.getLeavesOfType(VIEW_TYPE).length > 0;
    }

    private isSidebarVisible(): boolean {
        return this.workspace
            .getLeavesOfType(VIEW_TYPE)
            .some((leaf) => leaf.view.containerEl.isShown());
    }
}
