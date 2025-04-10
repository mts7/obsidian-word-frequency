import { Setting } from 'obsidian';

// TODO: move non-constants out of this file
export interface WordFrequencySettings {
    blacklist: string;
    threshold: number;
}

export type SettingFactory = (containerEl: HTMLElement) => Setting;

export const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
    threshold: 3,
};

export const ELEMENT_CLASSES = {
    containerButton: 'word-frequency-button-container',
    containerContent: 'word-frequency-sidebar-content',
    containerCount: 'word-frequency-count-container',
    containerFilter: 'word-frequency-filter-container',
    containerRow: 'word-frequency-row',
    containerThreshold: 'word-frequency-threshold-display',
    containerWordList: 'word-frequency-word-list',
    filter: 'word-frequency-filter',
    settingBlacklist: 'word-frequency-setting-blacklist',
    settingInfoItem: 'word-frequency-setting-item-info',
    settingItem: 'word-frequency-setting-item',
};

export const EVENT_UPDATE = 'word-frequency-update';
export const FREQUENCY_ICON = 'file-chart-column-increasing';
export const PLUGIN_NAME = 'Word frequency';
export const SETTINGS_DESCRIPTIONS = {
    blacklist: 'Comma-separated list of words to exclude.',
    threshold: 'Only show words that appear at least this many times.',
};
export const SETTINGS_NAMES = {
    blacklist: 'Blacklist',
    threshold: 'Word frequency threshold',
};
export const VIEW_TYPE = 'word-frequency-view';
