import { replace } from "../../utils";

const vowels = 'ёуеыаоэяию'.split('');
const voicedToVoiceless: { [key: string]: string } = {
    'б': 'п',
    'в': 'ф',
    'г': 'к',
    'д': 'т',
    'ж': 'ш',
    'з': 'с',
};
const voicelessToVoiced: { [key: string]: string } = {
    'п': 'б',
    'ф': 'в',
    'к': 'г',
    'т': 'д',
    'ш': 'ж',
    'с': 'з',
};
const canMakeVoiced = Object.keys(voicedToVoiceless)
let canMakeVoiceless: (string | undefined)[] = [undefined]
canMakeVoiceless = canMakeVoiceless.concat(Object.keys(voicelessToVoiced))
canMakeVoiceless.concat('цхчщ'.split(''))
const ignoreLetters = 'ъь'.split('')

function findIndexForPairedConsonantError(string: string): number[][] | null {

    return groupAdjacentNumbers(
        Array.from({ length: string.length })
            .map((_, idx) => isIndexPlaceForError(string, idx) ? idx : null).
            filter(it => it != null)
    )
}

function isIndexPlaceForError(string: string, idx: number) {
    const symbol = string[idx].toLocaleLowerCase()
    if (!(symbol in voicedToVoiceless || symbol in voicelessToVoiced)) return false
    if (symbol in voicedToVoiceless) return isIndexPlaceForVoicedToVoicelessError(string, idx);
    return isIndexPlaceForVoicelessToVoicedError(string, idx)
}

// оглушение
function isIndexPlaceForVoicedToVoicelessError(string: string, idx: number) {
    const symbol = string[idx].toLocaleLowerCase()

    if (!(symbol in voicedToVoiceless)) return false

    const nextIdx = string.split('').findIndex((symbol, index) => index > idx && !ignoreLetters.includes(symbol.toLocaleLowerCase()))
    const next = string[nextIdx];
    if (canMakeVoiceless.includes(next)) return true;

    if (!(next in voicedToVoiceless)) return false

    return isIndexPlaceForVoicedToVoicelessError(string, nextIdx)
}

//озвончение
function isIndexPlaceForVoicelessToVoicedError(string: string, idx: number) {
    const symbol = string[idx].toLocaleLowerCase()
    if (!(symbol in voicelessToVoiced)) return false

    const nextIdx = string.split('').findIndex((symbol, index) => index > idx && !ignoreLetters.includes(symbol.toLocaleLowerCase()))
    const next = string[nextIdx];
    if (canMakeVoiced.includes(next)) return true

    if (!(next in voicelessToVoiced)) return false

    return isIndexPlaceForVoicelessToVoicedError(string, nextIdx)

}

function groupAdjacentNumbers(numbers: number[]): number[][] {
    if (numbers.length === 0) return [];

    const result: number[][] = [];
    let currentGroup: number[] = [numbers[0]];

    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] === numbers[i - 1] + 1) {
            currentGroup.push(numbers[i]);
        } else {
            result.push(currentGroup);
            currentGroup = [numbers[i]];
        }
    }

    result.push(currentGroup);
    return result;
}


export const makePairedConsonantError = (string: string) => {
    const indexes = findIndexForPairedConsonantError(string)?.sample()
    if (!indexes?.length) return string

    let res = string
    indexes.forEach(replaceIndex => {
        const symbol = res[replaceIndex].toLocaleLowerCase()
        const replacement = symbol in voicedToVoiceless ? voicedToVoiceless[symbol] : voicelessToVoiced[symbol]
        res = replace(res, replaceIndex, replacement)
    })

    return res
}

export const cantMakePairedConsonantErrorInThisWord = (string: string) => !findIndexForPairedConsonantError(string)?.length || string.length < 3