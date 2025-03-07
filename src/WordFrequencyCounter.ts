export class WordFrequencyCounter {
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
}