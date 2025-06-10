import fs from 'fs';
import { CorpusItem } from './generateSentencesWithError';
import path from 'path';

async function finalToBinary(dir: string) {
    const data = []

    let corrCount = 0;
    let incorrCount = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const text = fs.readFileSync(path.join(dir, file), 'utf-8');

        const item = JSON.parse(text) as CorpusItem
        item.annotations.length ? incorrCount++ : corrCount++;


        data.push({
            text: item.text,
            label: item.annotations.length ? 'incorrect' : 'correct'
        })
    }

    const diff = incorrCount - corrCount;

    const dirAdd= '/home/roman/projects/mag/ts/corpus-just-correct-sentences'
    const filesAdd = fs.readdirSync(dirAdd).slice(0, diff);

    for (const file of filesAdd) {
        const text = fs.readFileSync(path.join(dirAdd, file), 'utf-8');

        const item = JSON.parse(text) as CorpusItem
        item.annotations.length ? incorrCount++ : corrCount++;


        data.push({
            text: item.text,
            label: item.annotations.length ? 'incorrect' : 'correct'
        })
    }
    console.log({ corrCount, incorrCount })

    fs.writeFileSync('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus-4.json', JSON.stringify(data, null, 2))
}

finalToBinary('/home/roman/projects/mag/ts/corpus-binary-no-typos')