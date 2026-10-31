import { Setting } from 'obsidian';

export interface WordFrequencySettings {
    blacklist: string;
    threshold: number;
}

export type SettingFactory = (_: HTMLElement) => Setting;
