import { WorkspaceLeaf } from 'obsidian';
import { NoteTracker } from '../NoteTracker';
import { UpdateScheduler } from '../UpdateScheduler';
import { WordFrequencyCounter } from '../WordFrequencyCounter';
import {
    createNote,
    FakeWorkspace,
    recordUpdates,
    replaceNoteContent,
} from './fakes/workspace';

const EDIT_DELAY_MS = 3000;
const FRUIT_COUNTS = [
    ['apple', 2],
    ['banana', 1],
];
const VEGETABLE_COUNTS = [
    ['carrot', 2],
    ['potato', 1],
];

function finishPendingUpdates(): void {
    jest.advanceTimersByTime(0);
}

function createScheduler(workspace: FakeWorkspace): UpdateScheduler {
    const tracker = new NoteTracker(workspace.getWorkspace());
    const counter = new WordFrequencyCounter(tracker);

    return new UpdateScheduler(
        { registerEvent: jest.fn() },
        workspace.getWorkspace(),
        tracker,
        () => counter.triggerUpdateContent()
    );
}

describe('UpdateScheduler', () => {
    let workspace: FakeWorkspace;
    let scheduler: UpdateScheduler;
    let updates: ReturnType<typeof recordUpdates>;
    let fruit: ReturnType<typeof createNote>;
    let vegetables: ReturnType<typeof createNote>;

    function switchToNote(note: ReturnType<typeof createNote>): void {
        workspace.activateNote(note);
        finishPendingUpdates();
    }

    beforeEach(() => {
        jest.useFakeTimers();
        workspace = new FakeWorkspace();
        workspace.openSidebar();
        scheduler = createScheduler(workspace);
        scheduler.registerEvents();
        fruit = createNote('apple banana apple');
        vegetables = createNote('carrot carrot potato');
        updates = recordUpdates();
    });

    afterEach(() => {
        updates.stop();
        jest.useRealTimers();
    });

    it('should register its workspace events with Obsidian so they are removed on unload', () => {
        const registrar = { registerEvent: jest.fn() };
        const tracker = new NoteTracker(workspace.getWorkspace());

        new UpdateScheduler(
            registrar,
            workspace.getWorkspace(),
            tracker,
            jest.fn()
        ).registerEvents();

        expect(registrar.registerEvent).toHaveBeenCalledTimes(3);
    });

    it('should count a note when it becomes active', () => {
        workspace.openNote(fruit);
        workspace.activeNote = fruit;

        workspace.trigger('active-leaf-change', fruit.leaf);
        finishPendingUpdates();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count the current note when a file opens', () => {
        workspace.openNote(fruit);
        workspace.activeNote = fruit;

        workspace.trigger('file-open', {});
        finishPendingUpdates();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count the most recent note once the layout is ready', () => {
        workspace.openNote(fruit);
        workspace.mostRecentNote = fruit;

        workspace.finishLayout();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count a note once when Obsidian reports both the pane change and the file opening', () => {
        workspace.activateNote(fruit);
        finishPendingUpdates();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count a note that becomes active in a window Obsidian does not report as active', () => {
        workspace.openNote(fruit);

        workspace.trigger('active-leaf-change', fruit.leaf);
        finishPendingUpdates();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should not recount when a pane that is not a note becomes active', () => {
        switchToNote(fruit);
        updates.counts.length = 0;

        workspace.activateSidebar();
        finishPendingUpdates();

        expect(updates.counts).toEqual([]);
    });

    it('should not recount when no pane is active', () => {
        switchToNote(fruit);
        updates.counts.length = 0;

        workspace.trigger('active-leaf-change', null);

        expect(updates.counts).toEqual([]);
    });

    it('should count a note once when the file opens before the pane changes', () => {
        workspace.openNote(fruit);

        workspace.trigger('file-open', {});
        workspace.trigger('active-leaf-change', fruit.leaf);
        finishPendingUpdates();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should not count a note switch after the pending update is cancelled', () => {
        workspace.activateNote(fruit);

        scheduler.cancelPendingUpdate();
        finishPendingUpdates();

        expect(updates.counts).toEqual([]);
    });

    it('should not count when the sidebar changes size and the counts are current', () => {
        switchToNote(fruit);
        updates.counts.length = 0;

        scheduler.updateIfSkipped();

        expect(updates.counts).toEqual([]);
    });

    it('should not count when the sidebar changes size before any update was needed', () => {
        workspace.openNote(fruit);
        workspace.activeNote = fruit;

        scheduler.updateIfSkipped();

        expect(updates.counts).toEqual([]);
    });

    it('should not count when the sidebar changes size after opening, since the sidebar counts as it opens', () => {
        workspace.sidebarLeaves = [];
        switchToNote(fruit);
        workspace.openSidebar();

        scheduler.updateIfSkipped();

        expect(updates.counts).toEqual([]);
    });

    describe('when asked to update now', () => {
        it('should count the current note right away', () => {
            workspace.openNote(fruit);
            workspace.activeNote = fruit;

            scheduler.updateNow();

            expect(updates.counts).toEqual([FRUIT_COUNTS]);
        });

        it('should drop a pending note switch', () => {
            workspace.activateNote(fruit);

            scheduler.updateNow();
            finishPendingUpdates();

            expect(updates.counts).toEqual([FRUIT_COUNTS]);
        });

        it('should drop a pending edit', () => {
            switchToNote(fruit);
            updates.counts.length = 0;
            workspace.editNote();

            scheduler.updateNow();
            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([FRUIT_COUNTS]);
        });
    });

    describe('with two sidebars', () => {
        let hiddenSidebar: WorkspaceLeaf;

        beforeEach(() => {
            hiddenSidebar = {} as WorkspaceLeaf;
            workspace.openSidebar(hiddenSidebar);
            workspace.coverSidebar([hiddenSidebar]);
        });

        it('should count while one of them can be seen', () => {
            switchToNote(fruit);

            expect(updates.counts).toEqual([FRUIT_COUNTS]);
        });

        it('should not count while neither can be seen', () => {
            workspace.coverSidebar();

            switchToNote(fruit);

            expect(updates.counts).toEqual([]);
        });
    });

    describe('while the sidebar is open but cannot be seen', () => {
        beforeEach(() => {
            switchToNote(fruit);
            updates.counts.length = 0;
            workspace.coverSidebar();
        });

        it('should not count a note that becomes active', () => {
            switchToNote(vegetables);

            expect(updates.counts).toEqual([]);
        });

        it('should not count an edited note', () => {
            workspace.editNote();
            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([]);
        });

        it('should count the current note once when the sidebar can be seen again', () => {
            switchToNote(vegetables);
            workspace.editNote();
            jest.advanceTimersByTime(EDIT_DELAY_MS);
            workspace.uncoverSidebar();

            scheduler.updateIfSkipped();
            scheduler.updateIfSkipped();

            expect(updates.counts).toEqual([VEGETABLE_COUNTS]);
        });

        it('should not count when the sidebar changes size and still cannot be seen', () => {
            switchToNote(vegetables);

            scheduler.updateIfSkipped();

            expect(updates.counts).toEqual([]);
        });

        it('should not count again when the sidebar is shown after it updated on opening', () => {
            switchToNote(vegetables);
            workspace.uncoverSidebar();
            scheduler.updateNow();
            updates.counts.length = 0;

            scheduler.updateIfSkipped();

            expect(updates.counts).toEqual([]);
        });
    });

    it('should count nothing while the sidebar is closed', () => {
        workspace.sidebarLeaves = [];

        workspace.activateNote(fruit);
        workspace.finishLayout();
        workspace.editNote();
        jest.advanceTimersByTime(EDIT_DELAY_MS);

        expect(updates.counts).toEqual([]);
    });

    describe('after an edit', () => {
        beforeEach(() => {
            switchToNote(fruit);
            updates.counts.length = 0;
        });

        it('should count the edited note once the edit delay has passed', () => {
            replaceNoteContent(fruit, 'apple apple banana apple');
            workspace.editNote();

            jest.advanceTimersByTime(EDIT_DELAY_MS - 1);
            expect(updates.counts).toEqual([]);
            jest.advanceTimersByTime(1);

            expect(updates.counts).toEqual([
                [
                    ['apple', 3],
                    ['banana', 1],
                ],
            ]);
        });

        it('should count only once for several quick edits', () => {
            workspace.editNote();
            workspace.editNote();
            workspace.editNote();

            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toHaveLength(1);
        });

        it('should count the note that is current when the delay ends, not the note that was edited', () => {
            workspace.editNote();
            switchToNote(vegetables);
            updates.counts.length = 0;

            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([VEGETABLE_COUNTS]);
        });

        it('should still count once per edit after many note switches', () => {
            for (let switches = 0; switches < 5; switches++) {
                switchToNote(vegetables);
                switchToNote(fruit);
            }
            updates.counts.length = 0;

            workspace.editNote();
            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([FRUIT_COUNTS]);
        });

        it('should not count after the pending update is cancelled', () => {
            workspace.editNote();

            scheduler.cancelPendingUpdate();
            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([]);
        });
    });
});
