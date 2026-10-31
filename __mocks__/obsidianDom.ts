type ElementOptions = {
    attr?: Record<string, string | number | boolean>;
    cls?: string | string[];
    text?: string;
};

function applyOptions(
    element: HTMLElement,
    options: ElementOptions = {}
): void {
    const classes = Array.isArray(options.cls)
        ? options.cls
        : [options.cls ?? ''];
    element.classList.add(...classes.filter((name) => name.length > 0));
    if (options.text !== undefined) {
        element.textContent = options.text;
    }
    Object.entries(options.attr ?? {}).forEach(([name, value]) =>
        element.setAttribute(name, String(value))
    );
}

Object.assign(HTMLElement.prototype, {
    createEl(this: HTMLElement, tag: string, options?: ElementOptions) {
        const element = document.createElement(tag);
        applyOptions(element, options);
        this.appendChild(element);

        return element;
    },
    createDiv(this: HTMLElement, options?: ElementOptions) {
        return this.createEl('div', options);
    },
    createSpan(this: HTMLElement, options?: ElementOptions) {
        return this.createEl('span', options);
    },
    empty(this: HTMLElement) {
        this.replaceChildren();
    },
    setText(this: HTMLElement, text: string) {
        this.textContent = text;
    },
    setAttr(this: HTMLElement, name: string, value: string | number | boolean) {
        this.setAttribute(name, String(value));
    },
    addClass(this: HTMLElement, ...classes: string[]) {
        this.classList.add(...classes);
    },
});
