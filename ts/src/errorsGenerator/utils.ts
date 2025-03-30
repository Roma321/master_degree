export function getIndexesForErrors(sentence: string, excluseWordsFunc: (s: string) => boolean, errorRate: number = 0.1,) {
    const words = sentence.split(/\s+/).map(word => word.replace(/^[.,!?;:]+|[.,!?;:]+$/g, ''))
    const exclusions = words.map((it, idx) => {
        if (excluseWordsFunc(it)) return idx
        return null
    }).filter(it => it != null)

    const baseErrors = 1 + Math.floor(errorRate * words.length)
    const additionalErrors = -Math.floor(words.length * errorRate * Math.log2(1 - Math.random()))
    const N = baseErrors + additionalErrors
    return generateRandomNumbers(
        N,
        0,
        words.length - 1,
        exclusions
    )
}

function generateRandomNumbers(
    n: number,
    min: number,
    max: number,
    exclusions: number[] = []
): number[] {
    if (!Number.isInteger(n) || n < 0) {
        throw new Error("n must be a non-negative integer");
    }
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0) {
        throw new Error("min and max must be non-negative integers");
    }
    if (min > max) {
        throw new Error("min must be less than or equal to max");
    }

    const availableNumbers: number[] = [];
    for (let num = min; num <= max; num++) {
        if (!exclusions.includes(num)) {
            availableNumbers.push(num);
        }
    }

    if (availableNumbers.length === 0) {
        throw new Error("No available numbers in the given range after exclusions");
    }

    const result: number[] = [];
    for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        result.push(availableNumbers[randomIndex]);
    }

    return result;
}

export function isRussianLowercase(char: string): boolean {
    if (char.length !== 1) return false;

    const russianLowercaseLetters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

    return russianLowercaseLetters.includes(char);
}

export const replace = (str: string, idx: number, replacement: string) => {
    const arr = str.split('');
    const isLower = isRussianLowercase(arr[idx]);

    arr[idx] = isLower ? replacement.toLocaleLowerCase() : replacement.toLocaleUpperCase();
    return arr.join('');
};

