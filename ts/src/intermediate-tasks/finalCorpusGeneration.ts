import { CorpusItem } from "../errorsGenerator/corpusGenerator/generateSentencesWithError";
import { lessThan2RussianLetters, makeError_V2 } from "../errorsGenerator/generate";
import { makeManyErrors } from "../errorsGenerator/morpho/makeMorphoError";
import { cantMakePairedConsonantErrorInThisWord, makePairedConsonantError } from "../errorsGenerator/ortho/paired_consonant/makePairedConsonantError";
import { makeTypo } from "../errorsGenerator/ortho/typo/makeTypo";
import { makeParonymError_V2 } from "../errorsGenerator/paronym/makeParonymError";
import { normalizeSpacesAroundPunctuation } from "../errorsGenerator/utils";

const MORPH = 'morph'
const TYPO = 'typo'
const PARONYM = 'paronym';

export async function generateDifferentErrors(text: string) {
    const errors = []
    if (Math.random() * 10 > 0) errors.push(MORPH); //сликшом часто не получается ошибки
    if (Math.random() * 10 > 7) errors.push(TYPO);
    if (Math.random() * 10 > 6) errors.push(PARONYM);
    const res: CorpusItem = {
        text: normalizeSpacesAroundPunctuation(text),
        annotations: []
    }
    if (errors.includes(MORPH)) {
        console.log('1')
        const withMorph = await makeManyErrors(res.text);
        res.text = withMorph.text
        res.annotations.push(...withMorph.annotations)
    }

    if (errors.includes(PARONYM)) {
        console.log('2')

        try {
            const withParonym = await makeError_V2(
                res.text,
                makeParonymError_V2,
                lessThan2RussianLetters,
                'paronym'
            );

            res.text = withParonym.textWithError;

            res.annotations.push(...withParonym.errors)
        }
        catch (e) {
            console.log('paronym error', res.text)
        }
    }

    if (errors.includes(TYPO)) {
        console.log('3')

        const typoMode = Math.random() > 0.15
        const withTypo = await makeError_V2(
            res.text,
            typoMode ? async (word, context) => {
                return makeTypo(word)
            } : async (word, context) => {
                return makePairedConsonantError(word)
            },
            typoMode ? async () => false : async word => cantMakePairedConsonantErrorInThisWord(word),
            'typo'
        );

        res.text = withTypo.textWithError
        res.annotations.push(...withTypo.errors)
    }

    return res
}
