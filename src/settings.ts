import {
    DEFAULT_SETTINGS,
    MINIMUM_SHARE_LIMITS,
    PAGE_SIZE_OPTIONS,
} from './constants';
import { WordFrequencySettings } from './types';

export function resetMinimumShare(minimumShare: unknown): number {
    if (typeof minimumShare !== 'number' || !Number.isFinite(minimumShare)) {
        return DEFAULT_SETTINGS.minimumShare;
    }

    const { max, min } = MINIMUM_SHARE_LIMITS;

    return Math.min(max, Math.max(min, minimumShare));
}

export function resetPageSize(pageSize: unknown): number {
    return PAGE_SIZE_OPTIONS.includes(pageSize as number)
        ? (pageSize as number)
        : DEFAULT_SETTINGS.pageSize;
}

export function resetInvalidSettings(
    settings: WordFrequencySettings
): WordFrequencySettings {
    return {
        ...settings,
        minimumShare: resetMinimumShare(settings.minimumShare),
        pageSize: resetPageSize(settings.pageSize),
    };
}
