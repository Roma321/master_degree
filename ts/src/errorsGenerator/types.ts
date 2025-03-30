export type MakeErrorFunction = (text: string) => TextWithErrors

export type TextWithErrors = {
    correctText: string,
    textWithError: string,
    errors: TextError[]
}

export type TextError = {
    type: ErrorType,
    startIdx: number,
    length: number,
    correctReplacement: string
}

type ErrorType = 'ortho' | 'other'