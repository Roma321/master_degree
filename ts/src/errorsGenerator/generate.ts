import { MakeErrorFunction, MakeErrorFunction_V2, TextError } from "./types";
import { getIndexesForErrors, normalizeSpacesAroundPunctuation } from "./utils";
import { cantMakePairedConsonantErrorInThisWord } from "./ortho/paired_consonant/makePairedConsonantError";
import { makeTypo } from "./ortho/typo/makeTypo";
import { isNotOkForCaseError, makeCaseError } from "./morpho/makeMorphoError";

export async function lessThan2RussianLetters(string: string) {
    const russianLettersCount = (string.match(/[а-яё]/gi) || []).length;
    return russianLettersCount < 3
}


export const makeError: MakeErrorFunction = async (_text) => {
    const text = normalizeSpacesAroundPunctuation(_text)
    const indexes = await getIndexesForErrors(text, isNotOkForCaseError, 0);
    const words = text.split(/\s+/);
    const func = makeCaseError;
    let resText = '';
    const errors: TextError[] = [];

    for (const [idx, word] of words.entries()) {
        if (!indexes.includes(idx)) {
            resText += `${word} `;
            continue;
        }

        const errorsCount = indexes.filter(it => it === idx).length;
        let wordWithErrors = word;

        for (let i = 0; i < errorsCount; i++) {
            wordWithErrors = await func(wordWithErrors, text);
        }

        errors.push({
            correctReplacement: word,
            type: 'case',
            wordNumber: idx,
        });

        resText += `${wordWithErrors} `;
    }

    return {
        correctText: text,
        errors,
        textWithError: resText.trim(),
    };
};
// makeError('Так же, как и предыдущий, июльский, новый транш в случае выделения не будет перечислен в Россию.').then(console.log)

export const makeError_V2: MakeErrorFunction_V2 = async (_text, generate, avoid, kind) => {
    const text = normalizeSpacesAroundPunctuation(_text)
    const indexes = await getIndexesForErrors(text, avoid, 0);
    const words = text.split(/\s+/);
    let resText = '';
    const errors: TextError[] = [];

    for (const [idx, word] of words.entries()) {
        if (!indexes.includes(idx)) {
            resText += `${word} `;
            continue;
        }

        const errorsCount = indexes.filter(it => it === idx).length;
        let wordWithErrors = word;

        for (let i = 0; i < errorsCount; i++) {
            wordWithErrors = await generate(wordWithErrors, text);
        }

        errors.push({
            correctReplacement: word,
            type: kind,
            wordNumber: idx,
        });

        resText += `${wordWithErrors} `;
    }

    return {
        correctText: text,
        errors,
        textWithError: resText.trim(),
    };
};