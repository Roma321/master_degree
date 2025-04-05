export async function getIndexesForErrors(sentence: string, excluseWordsFunc: (s: string) => Promise<boolean>, errorRate: number = 0.1,) {
    const words = sentence.split(/\s+/).map(word => word.replace(/^[.,!?;:]+|[.,!?;:]+$/g, ''))
    const exclusions = (await Promise.all(words.map(async (it, idx) => {
        if (await excluseWordsFunc(it)) return idx
        return null
    }))).filter(it => it != null)

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

/**
 * Нормализует пробелы вокруг знаков препинания:
 * - ровно один пробел перед знаком препинания
 * - ровно один пробел после знака препинания (если это не конец строки или другой знак препинания)
 * @param text Входная строка
 * @returns Строка с нормализованными пробелами вокруг знаков препинания
 */
export function normalizeSpacesAroundPunctuation(text: string): string {
    // Знаки препинания, которые мы обрабатываем
    const punctuationMarks = [',', '.', '!', '?', ':', ';', '…'];
    const punctuationRegex = `[${punctuationMarks.map(mark => '\\' + mark).join('')}]`;

    return (
        text
            // Удаляем все пробелы вокруг знаков препинания
            .replace(new RegExp(`\\s*(${punctuationRegex})\\s*`, 'g'), '$1')
            // Добавляем пробел перед знаком препинания, если его нет
            .replace(new RegExp(`([^\\s])(${punctuationRegex})`, 'g'), '$1 $2')
            .replace(new RegExp(`(${punctuationRegex})([^\\s])`, 'g'), '$1 $2')
            .trim()
    );
}

// Пример использования
// const testString = "Привет,мир!Как дела    ?     точка.";
// console.log(normalizeSpacesAroundPunctuation(testString));
// Вывод: "Привет , мир ! Как дела ? Вот тебе ... многоточие : и точка ."