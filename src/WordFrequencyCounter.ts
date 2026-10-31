import { EVENT_UPDATE } from './constants';
import { NoteTracker } from './NoteTracker';
import { segmentText } from './segmentationUtils';

export class WordFrequencyCounter {
    private readonly noteTracker: NoteTracker;
    private readonly eventTarget: EventTarget;

    constructor(
        noteTracker: NoteTracker,
        eventTarget: EventTarget = window.document
    ) {
        this.noteTracker = noteTracker;
        this.eventTarget = eventTarget;
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

    triggerUpdateContent(): void {
        const note = this.noteTracker.findCurrentNote();
        if (note === undefined) {
            return;
        }

        try {
            const wordCounts = this.calculateWordFrequencies(
                note.editor.getValue()
            );
            this.eventTarget.dispatchEvent(
                new CustomEvent(EVENT_UPDATE, { detail: { wordCounts } })
            );
        } catch (error) {
            console.error('error in triggerUpdateContent', error);
        }
    }
}
