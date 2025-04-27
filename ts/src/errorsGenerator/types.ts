export type MakeErrorFunction = (text: string) => Promise<TextWithErrors>

export type MakeErrorFunction_V2 = (
    text: string,
    generateErrorFunc: (word: string, context: string) => Promise<string>,
    avoidWordFunc: (word: string) => Promise<boolean>,
    kind: string
) => Promise<TextWithErrors>

export type TextWithErrors = {
    correctText: string,
    textWithError: string,
    errors: TextError[]
}

export type TextError = {
    type: string,
    wordNumber: number
    // startIdx: number,
    // length: number,
    correctReplacement: string
}

type ErrorType = 'ortho' | 'other' | 'case'