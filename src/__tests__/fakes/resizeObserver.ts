export class FakeResizeObserver {
    private static readonly observers: FakeResizeObserver[] = [];
    private readonly callback: ResizeObserverCallback;
    private targets: Element[] = [];

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        FakeResizeObserver.observers.push(this);
    }

    static triggerResize(target: Element): void {
        FakeResizeObserver.observers
            .filter((observer) => observer.targets.includes(target))
            .forEach((observer) =>
                observer.callback([], observer as unknown as ResizeObserver)
            );
    }

    static isObserved(target: Element): boolean {
        return FakeResizeObserver.observers.some((observer) =>
            observer.targets.includes(target)
        );
    }

    observe(target: Element): void {
        this.targets.push(target);
    }

    disconnect(): void {
        this.targets = [];
    }
}
