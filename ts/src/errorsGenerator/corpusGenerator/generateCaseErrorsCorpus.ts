import * as fs from 'fs';
import * as path from 'path';
import * as fsp from 'fs/promises';
import { makeError } from '../generate';
import StanzaApi from '../../api/stanza';
import pLimit from 'p-limit';
import { TextWithErrors } from '../types';


async function writeCorpus(errorsCorpusDir: string, correctCorpusDir: string, outputCorpusDir: string): Promise<void> {
    try {
        const correctPathCorpusDir = path.join(outputCorpusDir, 'correct')
        const incorrectPathCorpusDir = path.join(outputCorpusDir, 'incorrect')
        if (!fs.existsSync(correctPathCorpusDir)) {
            fs.mkdirSync(correctPathCorpusDir, { recursive: true });
        }

        if (!fs.existsSync(incorrectPathCorpusDir)) {
            fs.mkdirSync(incorrectPathCorpusDir, { recursive: true });
        }
        const inputFiles: string[] = [];
        const entries = fs.readdirSync(errorsCorpusDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDirPath = path.join(errorsCorpusDir, entry.name);
                const files = fs.readdirSync(subDirPath);
                for (const file of files) {
                    inputFiles.push(`${entry.name}/${file}`);
                }
            } else {
                // Если нужно обрабатывать и файлы в корневой директории
                inputFiles.push(entry.name);
            }
        }

        for (const inputFile of inputFiles) {
            const takeCorrect = Math.random() > 0.5;
            if (takeCorrect) {
                const correctPath = path.join(correctCorpusDir, inputFile)
                const correctText = await fsp.readFile(correctPath, 'utf-8')
                const newCorrectPath = path.join(correctPathCorpusDir, inputFile.replace('/', '---'))
                fs.writeFileSync(newCorrectPath, correctText)
            } else {
                const incorrectPath = path.join(errorsCorpusDirectory, inputFile)
                const incorrectText = (JSON.parse(await fsp.readFile(incorrectPath, 'utf-8')) as TextWithErrors).textWithError
                const newIncorrectPath = path.join(incorrectPathCorpusDir, inputFile.replace('/', '---'))
                fs.writeFileSync(newIncorrectPath, incorrectText)
            }
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const errorsCorpusDirectory = '/home/roman/projects/mag/ts/output';
const correctCorpusDirectory = '/home/roman/projects/mag/corpus/splitted-batch-1';
const outputCorpusDir = '/home/roman/projects/mag/ts/caseErrorsBinaryClassification';

writeCorpus(errorsCorpusDirectory, correctCorpusDirectory, outputCorpusDir);
// const api = new StanzaApi()
// api.inflectWord({
//     lemma: 'Подопечный',
//     features: { 'Animacy': 'Anim', 'Case': 'Dat', 'Gender': 'Masc', 'Number': 'Plur' }
// })