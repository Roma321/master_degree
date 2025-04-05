export type MakeErrorFunction = (text: string) => Promise<TextWithErrors>

export type TextWithErrors = {
    correctText: string,
    textWithError: string,
    errors: TextError[]
}

export type TextError = {
    type: ErrorType,
    wordNumber: number
    // startIdx: number,
    // length: number,
    correctReplacement: string
}

type ErrorType = 'ortho' | 'other' | 'case'