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

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count the current note when a file opens', () => {
        workspace.openNote(fruit);
        workspace.activeNote = fruit;

        workspace.trigger('file-open', {});

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count the most recent note once the layout is ready', () => {
        workspace.openNote(fruit);
        workspace.mostRecentNote = fruit;

        workspace.finishLayout();

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should count a note that becomes active in a window Obsidian does not report as active', () => {
        workspace.openNote(fruit);

        workspace.trigger('active-leaf-change', fruit.leaf);

        expect(updates.counts).toEqual([FRUIT_COUNTS]);
    });

    it('should not recount when a pane that is not a note becomes active', () => {
        workspace.activateNote(fruit);
        updates.counts.length = 0;

        workspace.activateSidebar();

        expect(updates.counts).toEqual([]);
    });

    it('should not recount when no pane is active', () => {
        workspace.activateNote(fruit);
        updates.counts.length = 0;

        workspace.trigger('active-leaf-change', null);

        expect(updates.counts).toEqual([]);
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
            workspace.activateNote(fruit);
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
            workspace.activateNote(vegetables);
            updates.counts.length = 0;

            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([VEGETABLE_COUNTS]);
        });

        it('should still count once per edit after many note switches', () => {
            for (let switches = 0; switches < 5; switches++) {
                workspace.activateNote(vegetables);
                workspace.activateNote(fruit);
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
