import { countBy, groupBy, uniq } from 'lodash'
import fs from 'fs/promises';
import { TextError, TextWithErrors } from '../errorsGenerator/types';
import { CorpusItem } from '../errorsGenerator/corpusGenerator/generateSentencesWithError';
import path from 'path';

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
    // console.log(parsedData[0])
    const errorTypes = uniq(parsedData.flatMap(it => it.annotations.map(a => a.errorType)))
    console.log(errorTypes)
    const stat = countBy(parsedData.flatMap(it => it.annotations), it => it.errorType)
    console.log(stat)

    return parsedData
}

async function saveOnlyCaseErrors(dir: string) {
    const allSentences = await parse()
    allSentences.forEach((sentence, idx) => {
        if (!sentence.annotations.some(ann => ann.errorType.toLocaleLowerCase().includes('падеж'))) return

        const sentenceParts = sentence.text.split(' ');
        const sentencePartsButCorrect = [...sentenceParts]
        sentence.annotations.forEach(annotation => {
            if (annotation.end - annotation.start !== 1) return //TODO
            sentencePartsButCorrect[annotation.start] = annotation.correction


            if (annotation.errorType.toLocaleLowerCase().includes('падеж')) return
            sentenceParts[annotation.start] = annotation.correction
        });

        fs.writeFile(`${dir}/incorrect/${idx}.txt`, sentenceParts.join(' '))
        fs.writeFile(`${dir}/correct/${idx}.txt`, sentencePartsButCorrect.join(' '))
    });
}

async function binaryClassification(dir: string) {
    const allSentences = await parse();
    // const data = allSentences.map(s => ({
    //     text: s.text,
    //     label: s.annotations.length ? 'incorrect' : 'correct'
    // }))
    const data = [];
    // fs.writeFile(path.join(dir, 'corpus.json'), JSON.stringify(data, null, 2));
    const corpusFiles = await fs.readdir('/home/roman/projects/mag/ts/corpus-final')
    let totalIncorrectCount = 0
    let totalCorrectCount = 0;

    for (const file of corpusFiles) {
        const readFile = path.join('/home/roman/projects/mag/ts/corpus-final', file);
        const text = await fs.readFile(readFile, 'utf-8');
        const item = JSON.parse(text) as CorpusItem
        if (item.annotations.length) {
            totalIncorrectCount++;
            if (totalIncorrectCount > 1000) {
                continue
            }
        } else {
            totalCorrectCount++;
            if (totalCorrectCount > 1000) {
                continue
            }
        }
        data.push({
            text: item.text,
            label: item.annotations.length ? 'incorrect' : 'correct'
        });
    }

    // const corpusFiles2 = await fs.readdir('/home/roman/projects/mag/ts/corpus-final-2')
    // for (const file of corpusFiles2) {
    //     const readFile = path.join('/home/roman/projects/mag/ts/corpus-final-2', file);
    //     const text = await fs.readFile(readFile, 'utf-8');
    //     const item = JSON.parse(text) as CorpusItem
    //     !item.annotations.length && data.push({
    //         text: item.text,
    //         label: 'correct'
    //     });
    // }

    console.log(
        data.filter(it => it.label === 'correct').length,
        data.filter(it => it.label === 'incorrect').length,
    )

    fs.writeFile(path.join(dir, 'corpus-3.json'), JSON.stringify(data, null, 2));



}

async function saveNewFormatErrors(dir: string) {
    const allSentences = await parse();
    //"Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"
    const rozovskayaToMeMap: Record<string, string | null> = {
        'Орфография': 'typo',
        'Сущ.:Падеж': 'Case',
        'Прил.:Падеж': 'Case',
        'Союз': null,
        'Лексика:морф.': null,
        'Заменить': 'paronym',
        'Сущ.:Род': 'Gender',
        'Сущ.:Число': 'Number',
        'Вставить': 'ESCAPE',
        'Глагол:Др.': 'ESCAPE',
        'Убрать': 'ESCAPE',
        'Глагол:Вид': null,
        'Лексика:замена': 'paronym',
        'Местоимение': null,
        'Параллель': null,
        'Глагол:Залог': 'Voice',
        'Предлог': null,
        'Обр.параллель': 'ESCAPE',
        'Глагол:Число/Лицо': 'Person',
        'Прил.:Число': 'Number',
        'Глагол:Время': 'Tense',
        'Прил.:Род': 'Gender',
        'Прил.:Др.': null,
        'Калька': null
    }
    allSentences.forEach((sentence, idx) => {
        const sentenceParts = sentence.text.split(' ');
        const resultAnnotations: TextError[] = []
        // const sentencePartsButCorrect = [...sentenceParts]
        if (sentence.annotations.some(ann => rozovskayaToMeMap[ann.errorType] === 'ESCAPE' || ann.end - ann.start !== 1)) return;
        sentence.annotations.forEach(annotation => {
            // if (annotation.end - annotation.start !== 1) return //TODO
            // sentencePartsButCorrect[annotation.start] = annotation.correction


            // if (annotation.errorType.toLocaleLowerCase().includes('падеж')) return
            if (rozovskayaToMeMap[annotation.errorType]) {
                resultAnnotations.push({
                    wordNumber: annotation.start,
                    type: rozovskayaToMeMap[annotation.errorType]!,
                    correctReplacement: ''
                })
            } else {
                sentenceParts[annotation.start] = annotation.correction
            }

        });

        const corpusItem: CorpusItem = {
            annotations: resultAnnotations,
            text: sentenceParts.join(' ')
        }

        fs.writeFile(`${dir}/2-file_${idx}.txt`, JSON.stringify(corpusItem, null, 2))
    });
}

binaryClassification('/home/roman/projects/mag/ts/corpus-only-binary-classification')
// parse()
// saveNewFormatErrors('/home/roman/projects/mag/ts/test-final')