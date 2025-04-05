
export type MorphFeaturesResponse = {
    word: string;
    features: RussianMorphFeatures;
    pos: UniversalPOSTag
};

export type MorphFeaturesResponseWithContext = {
    sentence: string,
    words: MorphFeaturesResponse[]
};

export type UniversalPOSTag =
    | "NOUN" | "VERB" | "ADJ" | "ADV" | "PRON" | "DET"
    | "ADP" | "CCONJ" | "SCONJ" | "PART" | "INTJ" | "NUM"
    | "PUNCT" | "SYM" | "X" | "PROPN";

export type InflectRequest = {
    lemma: string;
    features?: RussianMorphFeatures;
    features_str?: string;
};
export type InflectResponse = {
    lemma: string;
    inflected: string;
    requested_features: RussianMorphFeatures;
    normal_form: string;
    tag: string;
    success: boolean;
};
export interface SimilarityResponse {
    similarity: number;
}
export type LemmaResponse = {
    lemma: string;
};
export type SentenceSplitResponse = {
    sentences: string[];
};
export type ProcessResponse = {
    result: any;
};
export type ApiError = {
    error: string;
    detail?: string;
    success?: boolean;
};
export type RussianMorphFeatures = {
    /** Одушевлённость */
    Animacy?: "Anim" | "Inan" | null;
    /** Вид */
    Aspect?: "Imp" | "Perf" | null;
    /** Падеж */
    Case?:
    | "Nom"  // именительный
    | "Gen"  // родительный
    | "Dat"  // дательный
    | "Acc"  // винительный
    | "Loc"  // предложный
    | "Ins"  // творительный
    | "Voc"  // звательный (редко для русского)
    | null;
    /** Степень сравнения (для прилагательных и наречий) */
    Degree?: "Pos" | "Cmp" | "Sup" | null;
    /** Род */
    Gender?: "Masc" | "Fem" | "Neut" | null;
    /** Наклонение (для глаголов) */
    Mood?: "Ind" | "Imp" | "Cnd" | null;
    /** Число */
    Number?: "Sing" | "Plur" | null;
    /** Лицо (для глаголов) */
    Person?: "1" | "2" | "3" | null;
    /** Залог (для глаголов) */
    Voice?: "Act" | "Pass" | "Mid" | null;
    /** Время (для глаголов) */
    Tense?: "Past" | "Pres" | "Fut" | null;
    /** Краткая/полная форма (для прилагательных) */
    VerbForm?: "Fin" | "Inf" | "Part" | "Trans" | null;
    /** Собственное имя */
    Proper?: "Yes" | null;
    /** Числительное: тип */
    NumType?: "Card" | "Ord" | "Frac" | "Sets" | null;
    /** Форма числительного */
    NumForm?: "Digit" | "Roman" | "Word" | null;
    /** Притяжательность (для местоимений) */
    Poss?: "Yes" | null;
    /** Тип местоимения */
    PronType?: "Prs" | "Rel" | "Int" | "Dem" | "Neg" | "Tot" | null;
    /** Рефлексивность (для местоимений и глаголов) */
    Reflex?: "Yes" | null;
    /** Аббревиатура */
    Abbr?: "Yes" | null;
    /** Ошибка (опечатка) */
    Typo?: "Yes" | null;
};

type FeatureValue<T> = Exclude<T, null | undefined>;
type MorphFeatureValueMap = {
    [K in keyof RussianMorphFeatures]: Array<FeatureValue<RussianMorphFeatures[K]>>;
};

export const morphologicalFeatureValues: MorphFeatureValueMap = {
    Animacy: ['Anim', 'Inan'],
    Aspect: ['Imp', 'Perf'],
    Case: ['Nom', 'Gen', 'Dat', 'Acc', 'Loc', 'Ins', 'Voc'],
    Degree: ['Pos', 'Cmp', 'Sup'],
    Gender: ['Masc', 'Fem', 'Neut'],
    Mood: ['Ind', 'Imp', 'Cnd'],
    Number: ['Sing', 'Plur'],
    Person: ['1', '2', '3'],
    Tense: ['Past', 'Pres', 'Fut'],
    VerbForm: ['Fin', 'Inf', 'Part', 'Trans'],
    Voice: ['Act', 'Pass', 'Mid'],
    Proper: ['Yes'],
    NumType: ['Card', 'Ord', 'Frac', 'Sets'],
    NumForm: ['Digit', 'Roman', 'Word'],
    Poss: ['Yes'],
    PronType: ['Prs', 'Rel', 'Int', 'Dem', 'Neg', 'Tot'],
    Reflex: ['Yes'],
    Abbr: ['Yes'],
    Typo: ['Yes']
} as const; // `as const` для точных литеральных типов