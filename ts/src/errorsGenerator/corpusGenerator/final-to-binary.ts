import fs from 'fs';
import { CorpusItem } from './generateSentencesWithError';
import path from 'path';

async function finalToBinary(dir: string) {
    const files = fs.readdirSync(dir);
    const data = []

    for (const file of files) {
        const text = fs.readFileSync(path.join(dir, file), 'utf-8');

        const item = JSON.parse(text) as CorpusItem
        data.push({
            text: item.text,
            label: item.annotations ? 'incorrect' : 'correct'
        })
    }

    fs.writeFileSync('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus-4.json', JSON.stringify(data, null, 2))
}

finalToBinary('/home/roman/projects/mag/ts/corpus-binary-no-typos')