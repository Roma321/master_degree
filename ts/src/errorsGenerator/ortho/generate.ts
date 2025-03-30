import { MakeErrorFunction, TextError } from "../types";
import { getIndexesForErrors } from "../utils";
import { cantMakePairedConsonantErrorInThisWord, makePairedConsonantError } from "./paired_consonant/makePairedConsonantError";
import { makeTypo } from "./typo/makeTypo";
function lessThan2RussianLetters(string: string) {
    const russianLettersCount = (string.match(/[а-яё]/gi) || []).length;
    return russianLettersCount < 3
}
export const makeError: MakeErrorFunction = (text) => {
    const indexes = getIndexesForErrors(text, cantMakePairedConsonantErrorInThisWord, 0.1)
    const words = text.split(/\s+/)
    const func = makePairedConsonantError;
    let resText = '';
    const errors: TextError[] = []
    words.forEach((word, idx) => {
        if (!indexes.includes(idx)) {
            resText += `${word} `;
            return
        }

        const errorsCount = indexes.filter(it => it === idx).length
        let wordWithErrors = word;
        for (let i = 0; i < errorsCount; i++) {
            wordWithErrors = func(wordWithErrors)
        }

        errors.push({
            startIdx: resText.length,
            correctReplacement: word,
            type: 'ortho',
            length: wordWithErrors.length
        })

        resText += `${wordWithErrors} `


    })
    return {
        correctText: text,
        errors,
        textWithError: resText.trim()
    }
}

console.log(makeError('Так же, как и предыдущий, июльский, новый транш в случае выделения не будет перечислен в Россию, а сразу пойдет на погашение задолженности перед МВФ.'))