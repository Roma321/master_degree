import { countBy, groupBy, uniq } from 'lodash'
import fs from 'fs/promises';

interface Annotation {
    start: number;
    end: number;
    errorType: string;
    correction: string;
}

interface SentenceData {
    text: string;
    annotations: Annotation[];
}

class M2Parser {
    static parse(content: string): SentenceData[] {
        const lines = content.split('\n');
        const sentences: SentenceData[] = [];
        let currentSentence: SentenceData | null = null;

        for (const line of lines) {
            if (line.startsWith('S ')) {
                // Новая строка с предложением
                if (currentSentence) {
                    sentences.push(currentSentence);
                }
                currentSentence = {
                    text: line.substring(2).trim(),
                    annotations: []
                };
            } else if (line.startsWith('A ') && currentSentence) {
                // Строка с аннотацией
                const annotation = this.parseAnnotationLine(line);
                if (annotation) {
                    currentSentence.annotations.push(annotation);
                }
            }
        }

        // Добавляем последнее предложение, если оно есть
        if (currentSentence) {
            sentences.push(currentSentence);
        }

        return sentences;
    }

    private static parseAnnotationLine(line: string): Annotation | null {
        const parts = line.substring(2).split('|||').map(part => part.trim());

        // Разбираем индексы начала и конца
        const indexParts = parts[0].split(' ');
        const start = parseInt(indexParts[0], 10);
        const end = parseInt(indexParts[1], 10);

        return {
            start,
            end,
            errorType: parts[1],
            correction: parts[2],
        };
    }
}


async function parse() {
    const filePath = '/home/roman/projects/mag/corpus/rozovskaya.M2'
    const m2Content = await fs.readFile(filePath, 'utf-8')
    const parsedData = M2Parser.parse(m2Content);
    const errorTypes = uniq(parsedData.flatMap(it => it.annotations.map(a=>a.errorType)))
    console.log(errorTypes)
    const stat = countBy(parsedData.flatMap(it=>it.annotations), it=>it.errorType)
    console.log(stat)
}

parse()