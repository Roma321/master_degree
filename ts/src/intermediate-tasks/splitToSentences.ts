import fs from 'fs/promises';
import path from 'path';
import StanzaApi from '../api/stanza';

class CorpusProcessor {
    private api: StanzaApi;

    constructor(apiBaseUrl: string) {
        this.api = new StanzaApi(apiBaseUrl);
    }

    public async splitToSentences(srcDir: string, targetDir: string): Promise<void> {
        try {
            await fs.access(srcDir);

            await fs.mkdir(targetDir, { recursive: true });

            const files = await fs.readdir(srcDir);

            for (const file of files) {
                const filePath = path.join(srcDir, file);
                const stats = await fs.stat(filePath);

                if (!stats.isFile()) continue;

                try {
                    const content = await fs.readFile(filePath, 'utf-8');

                    const { sentences } = await this.api.splitSentences(content);

                    const fileBaseName = path.basename(file, path.extname(file));
                    const fileTargetDir = path.join(targetDir, fileBaseName);
                    await fs.mkdir(fileTargetDir, { recursive: true });

                    await this.saveSentencesToFiles(sentences, fileTargetDir);

                    console.log(`Processed ${file}: ${sentences.length} sentences`);
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                    continue;
                }
            }

            console.log('All files processed successfully');
        } catch (error) {
            console.error('Error in splitToSentences:', error);
            throw error;
        }
    }

    private async saveSentencesToFiles(sentences: string[], targetDir: string): Promise<void> {
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const sentenceFileName = `sentence_${i + 1}.txt`;
            const sentenceFilePath = path.join(targetDir, sentenceFileName);

            await fs.writeFile(sentenceFilePath, sentence, 'utf-8');
        }
    }
}

const apiBaseUrl = 'http://localhost:8000';
const processor = new CorpusProcessor(apiBaseUrl);

// processor.splitToSentences(
//     "/home/roman/projects/mag/corpus/default/batch_2",
//     "/home/roman/projects/mag/corpus/splitted-batch-2"
// )
//     .then(() => console.log('Processing completed'))
//     .catch(err => console.error('Processing failed:', err));