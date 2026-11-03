export type WordCount = [string, number];

export interface SelectionCriteria {
    blacklist: Set<string>;
    filter: string;
    minimumShare: number;
    threshold: number;
}

export interface WordPage {
    hasMore: boolean;
    words: WordCount[];
}

export type WordSelector = (
    wordCounts: WordCount[],
    criteria: SelectionCriteria
) => WordCount[];

export function collectBlacklistedWords(blacklist: string): Set<string> {
    return new Set(blacklist.split(',').map((word) => word.trim()));
}

export function selectPage(
    words: WordCount[],
    pagesShown: number,
    pageSize: number
): WordPage {
    const visibleCount = pagesShown * pageSize;

    return {
        hasMore: words.length > visibleCount,
        words: words.slice(0, visibleCount),
    };
}

export function calculateCutoff(
    highestCount: number,
    minimumShare: number
): number {
    return Math.ceil((highestCount * minimumShare) / 100);
}

export function selectWords(
    wordCounts: WordCount[],
    criteria: SelectionCriteria
): WordCount[] {
    const eligible = wordCounts.filter(
        ([word, count]) =>
            !criteria.blacklist.has(word) && count >= criteria.threshold
    );
    const filter = criteria.filter.toLowerCase();
    if (filter !== '') {
        return eligible.filter(([word]) => word.toLowerCase().includes(filter));
    }

    const highestCount = eligible.reduce(
        (highest, [, count]) => Math.max(highest, count),
        0
    );
    const cutoff = calculateCutoff(highestCount, criteria.minimumShare);

    return eligible.filter(([, count]) => count >= cutoff);
}
