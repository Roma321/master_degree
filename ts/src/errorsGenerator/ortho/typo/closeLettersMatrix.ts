
type CloseLetters = {
    level1: string[],
    level2: string[],
    other: string[]
}

type CloseLettersMatrix = Record<string, CloseLetters>


const RUSSIAN_LAYOUT = [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.']
];

const ALL_RUSSIAN_LETTERS = Array.from(new Set(RUSSIAN_LAYOUT.flat()));

function getAdjacentLetters(row: number, col: number): string[] {
    const adjacent: string[] = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < RUSSIAN_LAYOUT.length &&
            newCol >= 0 && newCol < RUSSIAN_LAYOUT[newRow].length) {
            adjacent.push(RUSSIAN_LAYOUT[newRow][newCol]);
        }
    }

    return adjacent;
}

function buildCloseLettersMatrix(): CloseLettersMatrix {
    const result: CloseLettersMatrix = {};
    const letterPositions: Record<string, [number, number]> = {};

    for (let row = 0; row < RUSSIAN_LAYOUT.length; row++) {
        for (let col = 0; col < RUSSIAN_LAYOUT[row].length; col++) {
            const letter = RUSSIAN_LAYOUT[row][col];
            letterPositions[letter] = [row, col];
        }
    }

    for (const letter of ALL_RUSSIAN_LETTERS) {
        if (!letterPositions[letter]) continue;

        const [row, col] = letterPositions[letter];
        const level1 = getAdjacentLetters(row, col);

        const level2 = new Set<string>();
        for (const neighbor of level1) {
            if (!letterPositions[neighbor]) continue;
            const [nRow, nCol] = letterPositions[neighbor];
            for (const neighbor2 of getAdjacentLetters(nRow, nCol)) {
                if (neighbor2 !== letter && !level1.includes(neighbor2)) {
                    level2.add(neighbor2);
                }
            }
        }

        const other = ALL_RUSSIAN_LETTERS.filter(
            l => l !== letter &&
                !level1.includes(l) &&
                !Array.from(level2).includes(l)
        );

        result[letter] = {
            level1,
            level2: Array.from(level2),
            other
        };
    }

    return result;
}

export const RUSSIAN_CLOSE_LETTERS: CloseLettersMatrix = buildCloseLettersMatrix();