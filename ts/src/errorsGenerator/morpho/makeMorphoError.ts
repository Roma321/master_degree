import StanzaApi from "../../api/stanza"
import { morphologicalFeatureValues, RussianMorphFeatures, UniversalPOSTag } from "../../api/types"
import '../../array.polyfill'

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
export async function makeMorphError(string: string) {
    const { features, pos } = await api.getMorphFeatures(string)
    const mutable = mutableFeatures[pos]
    const hasFeatures = Object.keys(features).filter(Boolean) as (keyof RussianMorphFeatures)[]
    const common = mutable.filter(feature =>
        hasFeatures.includes(feature)
    ) as (keyof RussianMorphFeatures)[];

    const featureToChange = common.sample()
    if (!featureToChange) return string
    const newFetureValue = morphologicalFeatureValues[featureToChange]!.sample()
    features[featureToChange] = newFetureValue as any
    const lemma = (await api.getLemma(string)).lemma

    const word = (await api.inflectWord({
        lemma,
        features
    })).inflected

    return word
}

// makeMorphError("Кружку")
