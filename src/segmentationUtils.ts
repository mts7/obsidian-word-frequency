export function segmentText(content: string): string[] {
    const normalized = content.toLowerCase().normalize('NFKC');

    const stripped = normalized.replace(/[^\p{L}\p{N}\s]+/gu, '');

    return stripped
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
}
