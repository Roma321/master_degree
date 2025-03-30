import { replace } from "../../utils";
import { RUSSIAN_CLOSE_LETTERS } from "./closeLettersMatrix";

export const makeTypo = (string: string) => {
    const errorIdx = Math.floor(Math.random() * string.length);
    const rand = Math.random()
    const letterToReplace = string[errorIdx].toLocaleLowerCase()
    if (rand < 0.85) return replace(string, errorIdx, RUSSIAN_CLOSE_LETTERS[letterToReplace].level1.sample()!)
    if (rand < 0.97) return replace(string, errorIdx, RUSSIAN_CLOSE_LETTERS[letterToReplace].level2.sample()!)
    return replace(string, errorIdx, RUSSIAN_CLOSE_LETTERS[letterToReplace].other.sample()!)
}


