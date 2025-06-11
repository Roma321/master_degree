import fs from "fs";
import { CorpusItem } from "./generateSentencesWithError";
import path from "path";

async function update() {
    type Type = {
        text: string,
        label: 'correct' | 'incorrect'
    }
    const src = '/home/rmamaev/projects/master_degree/ts/corpus-only-binary-classification/corpus-2.json';
    const srcData = JSON.parse(fs.readFileSync(src, 'utf-8')) as Type[];

    const extendDir = '/home/rmamaev/projects/master_degree/ts/caseErrorsBinaryClassification/correct'
    const extendSentences = fs.readdirSync(extendDir).map(file => fs.readFileSync(path.join(extendDir, file), 'utf-8'))

    const limit = 10_000;
    let addedIncorrect = 0;
    let addedCorrect = 0;

    const res: Type[] = []
    for (const item of srcData) {
        const isCorrect = item.label === 'correct';

        if (!isCorrect) {
            addedIncorrect++;
        } else {
            addedCorrect++;
        }

        res.push({
            text: item.text,
            label: isCorrect ? 'correct' : 'incorrect'
        });

        if (addedIncorrect > limit) {
            break
        }
    }

    const diff = addedIncorrect - addedCorrect;

    const addition = extendSentences.slice(0, diff);

    for (const addSent of addition) {
        res.push({
            text: addSent,
            label: 'correct'
        })
    }

    fs.writeFileSync('/home/rmamaev/projects/master_degree/ts/corpus-only-binary-classification/corpus-5.json', JSON.stringify(res, null, 2))
}

update()