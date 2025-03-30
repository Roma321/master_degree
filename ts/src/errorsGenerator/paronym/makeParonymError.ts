import paronyms from '../../../data/paronyms.json';
import StanzaApi from '../../api/stanza';
import '../../array.polyfill'

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

// makeParonymError("абонентов").then(res=>console.log(res))