import { segmentText } from '../segmentationUtils';

describe('segmentText', () => {
    it('should split normalized text into lowercase words', () => {
        expect(segmentText('  Hello,   World!  ')).toEqual(['hello', 'world']);
    });

    it('should return an empty array for an empty string', () => {
        expect(segmentText('')).toEqual([]);
    });

    it('should return an empty array for whitespace only', () => {
        expect(segmentText(' \t\n ')).toEqual([]);
    });

    it('should return an empty array for punctuation only', () => {
        expect(segmentText('!?.,;:')).toEqual([]);
    });
});
