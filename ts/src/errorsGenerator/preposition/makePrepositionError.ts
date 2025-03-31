import { initializeDB } from "../../db/dataSource";
import { PrepositionUsageRepository } from "../../db/repos/prepositionError";

let allPreps: {
    preposition: string;
    count: number;
    percentage: number;
}[] = []

let allPrepsWithaccumulatedFrequencies: {
    from: number,
    to: number,
    prep: string
}[] = []

async function init() {
    // Сначала инициализируем подключение
    await initializeDB();

    await PrepositionUsageRepository.getPrepositionsWithFrequencyQB().then((res) => {
        allPreps = res;
        let acc = 0;
        for (const prep of res) {
            allPrepsWithaccumulatedFrequencies.push({
                from: acc,
                to: acc + prep.percentage / 100,
                prep: prep.preposition
            })

            acc += prep.percentage / 100
        }
    })
}

export function isPreposition(str: string) {
    let prep = allPreps.find(it => it.preposition === str.toLocaleLowerCase());
    if (!prep) return false

    return prep.percentage > 0.00155 // подбором
}

export function replacePreposition(prep: string) {
    let replacement = prep.toLocaleLowerCase()
    if (!isPreposition(prep)) return prep;

    while (prep == replacement) {
        let rand = Math.random()
        replacement = allPrepsWithaccumulatedFrequencies.find(it => it.from <= rand && it.to >= rand)!.prep
    }

    return replacement
}

init().then(() => {
    console.log(replacePreposition('в'))
});