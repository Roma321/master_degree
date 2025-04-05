import * as fs from 'fs';
import * as path from 'path';
import { makeError } from './generate';
import StanzaApi from '../api/stanza';
import pLimit from 'p-limit';

async function processFile(inputFilePath: string, outputFilePath: string): Promise<void> {
    try {
        // Читаем содержимое файла
        const sentence = fs.readFileSync(inputFilePath, 'utf-8').trim();

        // Вызываем метод makeError для строки
        const result = await makeError(sentence);

        // Создаём выходную директорию, если она не существует
        const outputDir = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Сохраняем результат в выходной файл
        fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

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
        const tasks = inputFiles.map((inputFile) => {
            const relativePath = path.relative(inputDir, inputFile);
            const outputFile = path.join(outputDir, relativePath);
            return limit(() => processFile(inputFile, outputFile));
        });

        // Запускаем все задачи параллельно
        await Promise.all(tasks);

        console.log('All files processed successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const inputDirectory = '/home/roman/projects/mag/corpus/splitted-batch-1';
const outputDirectory = './output';

writeCorpus(inputDirectory, outputDirectory);
// const api = new StanzaApi()
// api.inflectWord({
//     lemma: 'Подопечный',
//     features: { 'Animacy': 'Anim', 'Case': 'Dat', 'Gender': 'Masc', 'Number': 'Plur' }
// })