import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const letters = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ'.split('');
const BASE_URL = 'https://paronymonline.ru';
const paronymsList: string[][] = []
async function scrape() {
    for (const letter of letters) {
        const linksPage = await (await fetch(`${BASE_URL}/${letter}`)).text()
        const links = extractLinks(linksPage)
        for (const link of links) {
            const paronymPage = await (await fetch(link)).text()
            const paronyms = extractParonymsFromH1(paronymPage)
            if (!paronyms || paronyms.some(it => it.toLocaleLowerCase() != it)) continue
            paronymsList.push(paronyms)
        }
    }

    saveToJsonFile(paronymsList);
}
function extractLinks(htmlText: string): string[] {
    const $ = cheerio.load(htmlText);
    const links: string[] = [];

    const paronymsList = $('.paronyms-list.list-columns');

    if (!paronymsList.length) {
        console.warn('Элемент с классами paronyms-list.list-columns не найден');
        return links;
    }


    paronymsList.find('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href) {
            links.push(`${BASE_URL}${href}`);
        }
    });

    return links;
}

function saveToJsonFile(data: any, filename: string = 'paronyms.json') {
    try {
        const filePath = path.join(process.cwd(), filename);
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2), // 2 пробела для форматирования
            'utf-8'
        );
        console.log(`Данные успешно сохранены в файл: ${filePath}`);
    } catch (error) {
        console.error('Ошибка при сохранении файла:', error);
    }
}

function extractParonymsFromH1(htmlText: string) {
    const $ = cheerio.load(htmlText);

    const h1 = $('h1').first().text().trim();

    const prefix = 'Паронимы: ';
    if (!h1.startsWith(prefix)) {
        console.warn('Заголовок h1 не содержит паронимы в ожидаемом формате');
        return null;
    }

    const paronymsPart = h1.slice(prefix.length);
    const paronyms = paronymsPart.split(' — ');

    if (paronyms.length < 2) {
        console.warn('Не удалось разделить паронимы по разделителю " — "');
        return null;
    }

    return paronyms.map(it => it.trim()).filter(Boolean)
}
scrape()