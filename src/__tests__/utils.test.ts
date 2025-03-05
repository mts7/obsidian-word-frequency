import { debounce } from '../utils';

describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc();
        debouncedFunc();
        debouncedFunc();

        jest.advanceTimersByTime(50);
        expect(mockFunc).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc(1, 'test', { key: 'value' });

        jest.advanceTimersByTime(100);
        expect(mockFunc).toHaveBeenCalledWith(1, 'test', { key: 'value' });
    });

    it('should clear existing timeout when called again', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc();
        jest.advanceTimersByTime(50);
        debouncedFunc();
        jest.advanceTimersByTime(50);
        debouncedFunc();

        jest.advanceTimersByTime(100);

        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should handle zero delay', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 0);

        debouncedFunc();
        jest.advanceTimersByTime(0);

        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should handle negative delay', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, -100);

        debouncedFunc();
        jest.advanceTimersByTime(0);

        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple debounced calls with different delays', () => {
        const mockFunc1 = jest.fn();
        const mockFunc2 = jest.fn();
        const debouncedFunc1 = debounce(mockFunc1, 50);
        const debouncedFunc2 = debounce(mockFunc2, 100);

        debouncedFunc1();
        debouncedFunc2();

        jest.advanceTimersByTime(75);

        expect(mockFunc1).toHaveBeenCalledTimes(1);
        expect(mockFunc2).not.toHaveBeenCalled();

        jest.advanceTimersByTime(50);

        expect(mockFunc2).toHaveBeenCalledTimes(1);
    });

    it('should handle a function that throws an error', async () => {
        const mockFunc = jest.fn().mockImplementation(() => {
            throw new Error('Test Error');
        });
        const debouncedFunc = debounce(mockFunc, 100);

        try {
            debouncedFunc();
            await jest.advanceTimersByTime(100);
        } catch (error) {
            expect((error as Error).message).toBe('Test Error');
        }

        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should handle a function that returns a value', () => {
        const mockFunc = jest.fn().mockReturnValue('testValue');
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc();
        jest.advanceTimersByTime(100);

        expect(mockFunc).toHaveBeenCalledTimes(1);
        expect(mockFunc).toHaveReturnedWith('testValue');
    });
});