import paronyms from '../../../data/paronyms.json';
import StanzaApi from '../../api/stanza';
import '../../array.polyfill'
import * as fs from 'fs/promises';
import { ParonymCandidates } from './extendList/data';

const api = new StanzaApi()
const paronymsList = paronyms.flat()

export async function isParonym(string: string) {
    const lemma = (await api.getLemma(string)).lemma.toLocaleLowerCase()
    return paronymsList.includes(lemma)
}

export async function makeParonymError(string: string) {
    const lemma = (await api.getLemma(string)).lemma.toLocaleLowerCase();
    const replaceParonym = paronyms.find(list => list.includes(lemma))?.filter(it => it != lemma).sample();
    if (!replaceParonym) return string;

    const features = (await api.getMorphFeatures(string)).features;
    const res = api.inflectWord({
        lemma: replaceParonym,
        features
    });

    return (await res).inflected
}

let data: ParonymCandidates | undefined;

async function loadParonyms() {
    if (data) return data;

    const FILE_PATH = '/home/roman/projects/mag/ts/src/errorsGenerator/paronym/extendList/levenstein-d.txt'
    const _data: ParonymCandidates = JSON.parse(await fs.readFile(FILE_PATH, 'utf-8'));
    data = _data;
    return _data
}

export async function makeParonymError_V2(string: string) {

    const lemma = (await api.getLemma(string)).lemma.toLocaleLowerCase();
    const data = await loadParonyms();

    let replaceParonym = Object.keys(data[lemma])?.sample()
    if (!replaceParonym) replaceParonym = Object.keys(data).sample()!;

    const features = (await api.getMorphFeatures(string)).features;
    const res = api.inflectWord({
        lemma: replaceParonym,
        features
    });

    return (await res).inflected
}
