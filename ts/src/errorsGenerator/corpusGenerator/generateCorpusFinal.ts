import * as fs from 'fs';
import * as path from 'path';
import { makeError } from '../generate';
import StanzaApi from '../../api/stanza';
import pLimit from 'p-limit';
import { normalizeSpacesAroundPunctuation } from '../utils';
import { TextWithErrors } from '../types';
import { generateDifferentErrors } from '../../intermediate-tasks/finalCorpusGeneration';


export type CorpusItem = {
    text: string,
    annotations: TextWithErrors['errors']
}

async function processFile(inputFilePath: string, outputFileName: string, outDir: string): Promise<void> {
    try {
        const sentence = fs.readFileSync(inputFilePath, 'utf-8').trim();

        const errors = await generateDifferentErrors(sentence);
        const outputDir = path.dirname(outputFileName);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(`${outDir}/${outputFileName}`, JSON.stringify(errors, null, 2));

        console.log(`Processed file: ${inputFilePath}`);
    } catch (error) {
        console.error(`Error processing file ${inputFilePath}:`, error);
    }
}

async function writeCorpus(inputDir: string, outputDir: string): Promise<void> {
    try {
        // Проверяем существование входной директории
        if (!fs.existsSync(inputDir)) {
            throw new Error(`Input directory does not exist: ${inputDir}`);
        }

        // Рекурсивно получаем список всех файлов во входной директории
        const getAllFiles = (dir: string): string[] => {
            let results: string[] = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            entries.forEach((entry) => {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    results = results.concat(getAllFiles(fullPath));
                } else if (entry.isFile()) {
                    results.push(fullPath);
                }
            });

            return results;
        };

        const inputFiles = getAllFiles(inputDir);

        const limit = pLimit(2);

        // Создаём массив задач для параллельной обработки
        const tasks = inputFiles.map((inputFile, idx) => {
            return limit(() => processFile(inputFile, `${idx}.txt`, outputDir));
        });

        // Запускаем все задачи параллельно
        await Promise.all(tasks);

        console.log('All files processed successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const inputDirectory = '/home/roman/projects/mag/corpus/splitted-batch-2';
const outputDirectory = './corpus-final-2';

// writeCorpus(inputDirectory, outputDirectory);

async function statCorpus() {
    const dirName = '/home/roman/projects/mag/ts/corpus-final'
    const counter: Record<string, number> = {}
    const files = fs.readdirSync(dirName, { withFileTypes: true });
    console.log(files.length)
    files.forEach(file => {
        const text = fs.readFileSync(`${dirName}/${file.name}`, 'utf-8')
        const corpusItem: CorpusItem = JSON.parse(text);
        corpusItem.annotations.forEach(ann => {
            if (!counter[ann.type]) {
                counter[ann.type] = 0
            }

            counter[ann.type]++
        })
    });

    console.log(JSON.stringify(counter, null, 2))
}

statCorpus()