import * as fs from 'fs/promises';
import { levenshteinDistance } from './levenstein';
import StanzaApi from '../../../api/stanza';
import pLimit from 'p-limit';

type ParonymCandidates = Record<string, Record<string, Stat>>
type Stat = {
    levenstein: number,
    levensteinRelative: number,
    cosDist?: number
}
const FILE_PATH = '/home/roman/projects/mag/ts/src/errorsGenerator/paronym/extendList/levenstein-d.txt'
const FILE_PATH_WITH_COS_SIMILARITY = '/home/roman/projects/mag/ts/src/errorsGenerator/paronym/extendList/cos.txt'
const api = new StanzaApi();

async function calcLevensteinForAll() {
    const wordsText = await fs.readFile('/home/roman/projects/mag/ts/src/errorsGenerator/paronym/extendList/50000-russian-words-cyrillic-only.txt', 'utf-8')
    const words = wordsText.split('\n').map(it => it.trim().toLocaleLowerCase()).filter(Boolean)
    // const words = ['абонент', 'абонемент', 'апрель']
    const data = {} as ParonymCandidates
    words.forEach(word => {
        data[word] = {}
    });

    for (let i = 0; i < words.length - 1; i++) {
        console.log(i)
        if (words[i].length < 3) {
            continue
        }
        for (let j = i + 1; j < words.length; j++) {

            if (words[j].length < 3) continue
            const w1 = words[i];
            const w2 = words[j];
            const lenrelation = w1.length / w2.length
            if (lenrelation < 2 / 3 || lenrelation > 3 / 2) continue

            const distance = levenshteinDistance(w1, w2);
            const distanceRelative = distance / Math.min(w1.length, w2.length);

            if (distanceRelative > 0.34) continue;

            const stat: Stat = {
                levenstein: distance,
                levensteinRelative: distanceRelative
            }
            data[w1][w2] = stat;
            data[w2][w1] = stat;
        }
    }

    Object.keys(data).forEach(key => {
        if (Object.keys(data[key]).length === 0) {
            delete data[key]
        }
    })

    fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2))
}

// calcLevensteinForAll()

findParonyms()

async function findParonyms() {
    const data: ParonymCandidates = JSON.parse(await fs.readFile(FILE_PATH, 'utf-8'));
    const words = Object.keys(data);
    const limit = pLimit(10);
    const BATCH_SIZE = 1000;

    for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i];
        try {
            await api.getSemanticSimilarity(w1, w1); // есть ли слово в словаре
        } catch (e: any) {
            console.log('ignore key', w1);
            continue
        }
        const batchPromises = [];
        
        for (let j = i + 1; j < words.length; j++) {
            const w2 = words[j];
            if (!data[w1][w2]) continue

            batchPromises.push(limit(async () => {
                try {
                    const cosDistance = await api.getSemanticSimilarity(w1, w2);
                    const prevStat = data[w1][w2] || {};

                    const updatedStat = {
                        ...prevStat,
                        cosDist: cosDistance.similarity
                    };

                    data[w1][w2] = updatedStat;
                    data[w2][w1] = updatedStat;
                    console.log(w1, w2)
                } catch (error) {
                    // console.error(`Error processing pair ${w1}-${w2}:`, error);
                }
            }));
            console.log(i, j)

            if (batchPromises.length >= BATCH_SIZE) {
                await Promise.all(batchPromises);
                batchPromises.length = 0;
                await saveProgress(data);
            }
        }

        if (batchPromises.length > 0) {
            await Promise.all(batchPromises);
            await saveProgress(data);
        }

        console.log(`Processed word ${i + 1} of ${words.length}: ${w1}`);
    }
}

async function saveProgress(data: ParonymCandidates) {
    try {
        await fs.writeFile(FILE_PATH_WITH_COS_SIMILARITY, JSON.stringify(data, null, 2));
        console.log('Progress saved successfully');
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}