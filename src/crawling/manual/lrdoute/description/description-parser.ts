export class DescriptionParser {

    public static getNeighbors(
        source: string[],
        targets: string[],
        previousCount: number,
        nextCount: number,
        stopPredicate: (line: string) => boolean = (line) => !targets.some(t => line.includes(t)),


    ): string[] {
        const index = source.findIndex(line =>
            targets.some(target => line.includes(target))
        );

        if (index === -1) {
            return [];
        }

        const start = Math.max(0, index - previousCount);
        let end = nextCount >= 0 ? Math.min(source.length, index + (nextCount) + 1) : source.length;

        let i = start + 1;

        while (i < end && !stopPredicate(source[i])) {
            i++;
        }
        end = i;
        return source.slice(start, end);
    }

    public static parseDimensions(lines: string[]): Record<string, Record<string, string>> {
        const result: Record<string, Record<string, string>> = {};
        let currentGroup = '';

        for (const line of lines) {
            if (!line.includes(':')) {
                currentGroup = line.trim();
                result[currentGroup] = {};
            } else {
                const colonIdx = line.indexOf(':');
                const key = line.slice(0, colonIdx).trim();
                const value = line.slice(colonIdx + 1).trim();
                if (currentGroup) result[currentGroup][key] = value;
            }
        }

        return result;
    }
}