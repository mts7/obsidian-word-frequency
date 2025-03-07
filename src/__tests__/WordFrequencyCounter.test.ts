import { WordFrequencyCounter } from '../WordFrequencyCounter';

describe('calculateWordFrequencies', () => {
    const counter = new WordFrequencyCounter();

    it('should calculate word frequencies', () => {
        const content = 'hello world hello';

        const result = counter.calculateWordFrequencies(content);

        expect(result).toEqual([['hello', 2], ['world', 1]]);
    });

    it('should calculate word frequencies with punctuation and mixed case', () => {
        const content = 'Hello, world! hello. World?';

        const result = counter.calculateWordFrequencies(content);

        expect(result).toEqual([['hello', 2], ['world', 2]]);
    });

    it('should calculate word frequencies with numbers and special characters', () => {
        const content = 'word1 word2 123 word1 #$% hello. hello.';
        const result = counter.calculateWordFrequencies(content);
        expect(result).toEqual([['word1', 2], ['hello', 2], ['word2', 1], ['123', 1]]);
    });

    it('should calculate word frequencies with periods, colons, and slashes', () => {
        const content = 'test. test: test/ test.';
        const result = counter.calculateWordFrequencies(content);
        expect(result).toEqual([['test', 4]]);
    });

    it('should return an empty array when given an empty string', () => {
        const result = counter.calculateWordFrequencies('');
        expect(result).toEqual([]);
    });
});
