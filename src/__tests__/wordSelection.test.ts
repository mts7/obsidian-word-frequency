import {
    calculateCutoff,
    collectBlacklistedWords,
    SelectionCriteria,
    selectPage,
    selectWords,
    WordCount,
} from '../wordSelection';

describe('wordSelection', () => {
    describe('collectBlacklistedWords', () => {
        it('should split the blacklist on commas and trim each word', () => {
            expect(collectBlacklistedWords('the, and ,to')).toEqual(
                new Set(['the', 'and', 'to'])
            );
        });

        it('should read a single word', () => {
            expect(collectBlacklistedWords('apple')).toEqual(
                new Set(['apple'])
            );
        });
    });

    describe('selectPage', () => {
        const words: WordCount[] = [
            ['apple', 5],
            ['banana', 4],
            ['cherry', 3],
            ['date', 2],
            ['elderberry', 1],
        ];

        it('should select the first page and report more words', () => {
            expect(selectPage(words, 1, 2)).toEqual({
                hasMore: true,
                words: [
                    ['apple', 5],
                    ['banana', 4],
                ],
            });
        });

        it('should select every page shown so far', () => {
            expect(selectPage(words, 2, 2)).toEqual({
                hasMore: true,
                words: words.slice(0, 4),
            });
        });

        it('should report no more words when the pages fit exactly', () => {
            expect(selectPage(words.slice(0, 4), 2, 2)).toEqual({
                hasMore: false,
                words: words.slice(0, 4),
            });
        });

        it('should select every word when the pages go past the end', () => {
            expect(selectPage(words, 3, 2)).toEqual({
                hasMore: false,
                words,
            });
        });
    });

    describe('calculateCutoff', () => {
        it.each([
            [400, 25, 100],
            [400, 10, 40],
            [1200, 50, 600],
            [8, 25, 2],
            [15, 50, 8],
            [100, 0, 0],
            [100, 100, 100],
            [0, 50, 0],
        ])(
            'should cut off at %p with a minimum share of %p as %p',
            (highestCount, minimumShare, expected) => {
                expect(calculateCutoff(highestCount, minimumShare)).toBe(
                    expected
                );
            }
        );
    });

    describe('selectWords', () => {
        const fruit: WordCount[] = [
            ['apple', 15],
            ['banana', 9],
            ['cherry', 8],
            ['date', 7],
            ['elderberry', 2],
        ];
        let criteria: SelectionCriteria;

        beforeEach(() => {
            criteria = {
                blacklist: new Set(),
                filter: '',
                minimumShare: 0,
                threshold: 3,
            };
        });

        it('should list every word above the threshold when the minimum share is 0', () => {
            expect(selectWords(fruit, criteria)).toEqual([
                ['apple', 15],
                ['banana', 9],
                ['cherry', 8],
                ['date', 7],
            ]);
        });

        it('should list words used at least the minimum share as often as the top word', () => {
            criteria.minimumShare = 55;

            expect(selectWords(fruit, criteria)).toEqual([
                ['apple', 15],
                ['banana', 9],
            ]);
        });

        it('should list only the most frequent words when the minimum share is 100', () => {
            criteria.minimumShare = 100;

            expect(selectWords(fruit, criteria)).toEqual([['apple', 15]]);
        });

        it('should list down to the threshold when the cutoff is below it', () => {
            criteria.minimumShare = 10;

            expect(selectWords(fruit, criteria)).toEqual([
                ['apple', 15],
                ['banana', 9],
                ['cherry', 8],
                ['date', 7],
            ]);
        });

        it('should measure the share from the highest count that is not blacklisted', () => {
            criteria.blacklist = new Set(['apple']);
            criteria.minimumShare = 80;

            expect(selectWords(fruit, criteria)).toEqual([
                ['banana', 9],
                ['cherry', 8],
            ]);
        });

        it('should measure the share from the highest count in any order', () => {
            const unordered: WordCount[] = [
                ['date', 7],
                ['apple', 15],
                ['banana', 9],
            ];
            criteria.minimumShare = 55;

            expect(selectWords(unordered, criteria)).toEqual([
                ['apple', 15],
                ['banana', 9],
            ]);
        });

        it('should list nothing when no word meets the threshold', () => {
            criteria.threshold = 20;

            expect(selectWords(fruit, criteria)).toEqual([]);
        });

        it('should list nothing for an empty note', () => {
            expect(selectWords([], criteria)).toEqual([]);
        });

        it('should find filtered words below the cutoff', () => {
            criteria.filter = 'DAT';
            criteria.minimumShare = 100;

            expect(selectWords(fruit, criteria)).toEqual([['date', 7]]);
        });

        it('should match the filter anywhere in the word', () => {
            criteria.filter = 'an';

            expect(selectWords(fruit, criteria)).toEqual([['banana', 9]]);
        });

        it('should still apply the threshold and blacklist to filtered words', () => {
            criteria.filter = 'e';
            criteria.minimumShare = 100;
            criteria.blacklist = new Set(['cherry']);

            expect(selectWords(fruit, criteria)).toEqual([
                ['apple', 15],
                ['date', 7],
            ]);
        });

        it('should list every word that ties the highest count', () => {
            const tied: WordCount[] = [
                ['apple', 3],
                ['banana', 3],
                ['cherry', 3],
            ];
            criteria.minimumShare = 100;

            expect(selectWords(tied, criteria)).toEqual(tied);
        });
    });
});
