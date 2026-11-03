import { DEFAULT_SETTINGS } from '../constants';
import {
    resetInvalidSettings,
    resetMinimumShare,
    resetPageSize,
} from '../settings';

describe('settings', () => {
    describe('resetMinimumShare', () => {
        it.each([
            [0, 0],
            [40, 40],
            [100, 100],
            [150, 100],
            [-10, 0],
        ])('should keep %p within the limits as %p', (value, expected) => {
            expect(resetMinimumShare(value)).toBe(expected);
        });

        it.each([['25'], [NaN], [Infinity], [undefined], [null]])(
            'should reset %p to the default',
            (value) => {
                expect(resetMinimumShare(value)).toBe(
                    DEFAULT_SETTINGS.minimumShare
                );
            }
        );
    });

    describe('resetPageSize', () => {
        it.each([[15], [50], [100]])('should keep %p', (value) => {
            expect(resetPageSize(value)).toBe(value);
        });

        it.each([[0], [13], [200], ['50'], [undefined]])(
            'should reset %p to the default',
            (value) => {
                expect(resetPageSize(value)).toBe(DEFAULT_SETTINGS.pageSize);
            }
        );
    });

    describe('resetInvalidSettings', () => {
        it('should reset only the invalid values', () => {
            expect(
                resetInvalidSettings({
                    blacklist: 'apple',
                    minimumShare: 150,
                    pageSize: 0,
                    threshold: 7,
                })
            ).toEqual({
                blacklist: 'apple',
                minimumShare: 100,
                pageSize: DEFAULT_SETTINGS.pageSize,
                threshold: 7,
            });
        });
    });
});
