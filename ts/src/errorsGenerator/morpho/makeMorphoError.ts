import StanzaApi from "../../api/stanza"
import { morphologicalFeatureValues, RussianMorphFeatures, UniversalPOSTag } from "../../api/types"
import '../../array.polyfill'
import { lessThan2RussianLetters } from "../generate";

const isNotNoun = async (word: string) => !['NOUN', 'PROPN'].includes((await api.getMorphFeatures(word)).pos);
// export const isNotNoun = (word: string) =>!

export const isNotOkForCaseError = async (word: string) => {
    return lessThan2RussianLetters(word) || await isNotNoun(word)
}

export const makeCaseError = (word: string, context: string) => makeMorphError(word, 'Case', true, context)

const mutableFeatures: Record<UniversalPOSTag, (keyof RussianMorphFeatures)[]> = {
    NOUN: ['Case', 'Number'], // Падеж, число, одушевлённость, род (у существительных род постоянный, но учитываем для согласования)
    VERB: ['Tense', 'Number', 'Gender', 'Person', 'Mood', 'Aspect', 'Voice', 'VerbForm'], // Время, число, род (в прош. времени), лицо, наклонение, вид, залог
    ADJ: ['Case', 'Number', 'Gender', 'Degree'], // Падеж, число, род, степень сравнения
    ADV: ['Degree'], // Степень сравнения (для качественных наречий: "громко → громче")
    PRON: ['Case', 'Number', 'Gender', 'Person'], // Падеж, число, род, лицо (для личных местоимений)
    DET: ['Case', 'Number', 'Gender'], // Падеж, число, род (для местоимений-прилагательных: "этот", "каждый")
    ADP: [], // Предлоги не изменяются (но управляют падежом существительных)
    CCONJ: [], // Союзы не изменяются
    SCONJ: [], // Подчинительные союзы не изменяются
    PART: [], // Частицы не изменяются
    INTJ: [], // Междометия не изменяются
    NUM: ['Case', 'Gender', 'Number'], // Падеж, род (для "один"), число (для собирательных числительных)
    PUNCT: [], // Знаки препинания не изменяются
    SYM: [], // Символы не изменяются
    X: [], // Прочее (неизменяемые заимствования, аббревиатуры)
    PROPN: ['Case', 'Number'] // Падеж, число (для имён собственных)
};

const api = new StanzaApi()
export async function makeMorphError(
    string: string,
    feature?: keyof RussianMorphFeatures,
    tryUntilSuccess?: boolean,
    context?: string
) {
    // Получаем морфологические данные для слова
    const data = context
        ? await api.getMorphFeaturesWithContext(string, context)
        : await api.getMorphFeatures(string);
    if (!data) return string;

    const { features, pos } = data;
    const mutable = mutableFeatures[pos];
    const hasFeatures = Object.keys(features).filter(Boolean) as (keyof RussianMorphFeatures)[];
    const common = mutable.filter(feature =>
        hasFeatures.includes(feature)
    ) as (keyof RussianMorphFeatures)[];

    // Выбираем признак для изменения
    const featureToChange = feature ?? common.sample();
    if (!featureToChange || !common.includes(featureToChange)) return string;

    const lemma = (await api.getLemma(string)).lemma;

    for (let i = 0; i < 20; i++) {
        // Генерируем новое значение для выбранного признака
        const newFeatureValue = morphologicalFeatureValues[featureToChange]!.sample();
        features[featureToChange] = newFeatureValue as any;

        // Получаем измененное слово
        const word = (await api.inflectWord({
            lemma,
            features
        })).inflected;

        // Проверяем, нужно ли сохранить регистр исходного слова
        const isCapitalized = string[0] === string[0].toUpperCase();
        const correctedWord = isCapitalized
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word;

        // Возвращаем слово, если не требуется дополнительная проверка
        if (!tryUntilSuccess) return correctedWord;

        // Если требуется проверка на различие, возвращаем слово только если оно отличается от исходного
        if (correctedWord.toLocaleLowerCase() !== string.toLocaleLowerCase()) {
            return correctedWord;
        }
    }

    // Если цикл завершился без успеха, выбрасываем ошибку
    throw `что-то пошло не так: ${string}, ${feature}`;
}

// makeMorphError("Кружки", 'Case', true).then(console.log)
// getMorphFeaturesWithContext
// api.getMorphFeaturesWithContext('россию', 'Мне надо ехать в Россию').then(console.log)
