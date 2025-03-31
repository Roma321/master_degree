import { PrepositionUsage } from "../entities/prepositionErrors";
import { dataSource } from "../dataSource";

export const PrepositionUsageRepository = dataSource
    .getRepository(PrepositionUsage)
    .extend({
        // 1. Найти записи по main_lemma, dep_lemma и preposition
        async sameByWordsAndPrep(
            mainLemma: string,
            depLemma: string,
            preposition: string
        ): Promise<PrepositionUsage[]> {
            return this.find({
                where: {
                    main_lemma: mainLemma,
                    dep_lemma: depLemma,
                    preposition: preposition
                }
            });
        },

        // 2. Общий процент использования предлога
        async getPrepPercentageFull(prep: string): Promise<number> {
            const total = await this.count();
            const withPrep = await this.count({ where: { preposition: prep } });
            return total > 0 ? (withPrep * 100.0) / total : 0;
        },

        // 3. Процент использования предлога для dep_lemma
        async getPrepPercentageForDepLemma(
            prep: string,
            depLemma: string
        ): Promise<number> {
            const [result] = await this.query(`
                SELECT 
                    (COUNT(*) FILTER (WHERE preposition = $1) * 100.0 / 
                    NULLIF(COUNT(*), 0)) AS percentage
                FROM 
                    phrases
                WHERE 
                    dep_lemma = $2
            `, [prep, depLemma]);

            return result?.percentage ? parseFloat(result.percentage) : 0;
        },

        // 4. Проверка, редко ли используется предлог с dep_lemma
        async isPrepNotCommonForDepLemma(
            prep: string,
            depLemma: string
        ): Promise<boolean> {
            const prepPercentageAll = await this.getPrepPercentageFull(prep);
            const prepPercentageForDepLemma =
                await this.getPrepPercentageForDepLemma(prep, depLemma);
            return prepPercentageForDepLemma * 3 < prepPercentageAll;
        },

        // 5. Процент использования предлога для main_lemma
        async getPrepPercentageForMainLemma(
            prep: string,
            mainLemma: string
        ): Promise<number> {
            const [result] = await this.query(`
                SELECT 
                    (COUNT(*) FILTER (WHERE preposition = $1) * 100.0 / 
                    NULLIF(COUNT(*), 0)) AS percentage
                FROM 
                    phrases
                WHERE 
                    main_lemma = $2
            `, [prep, mainLemma]);

            return result?.percentage ? parseFloat(result.percentage) : 0;
        },

        // 6. Проверка, редко ли используется предлог с main_lemma
        async isPrepNotCommonForMainLemma(
            prep: string,
            mainLemma: string
        ): Promise<boolean> {
            const prepPercentageAll = await this.getPrepPercentageFull(prep);
            const prepPercentageForMainLemma =
                await this.getPrepPercentageForMainLemma(prep, mainLemma);
            return prepPercentageForMainLemma * 3 < prepPercentageAll;
        },

        // 7. Процент использования предлога для падежа
        async getPrepPercentageForCase(
            prep: string,
            depCase: string
        ): Promise<number> {
            const [result] = await this.query(`
                SELECT 
                    (COUNT(*) FILTER (WHERE preposition = $1) * 100.0 / 
                    NULLIF(COUNT(*), 0)) AS percentage
                FROM 
                    phrases
                WHERE 
                    dep_case = $2
            `, [prep, depCase]);

            return result?.percentage ? parseFloat(result.percentage) : 0;
        },

        // 8. Проверка, редко ли используется предлог с падежом
        async isPrepNotCommonForCase(
            prep: string,
            depCase: string
        ): Promise<boolean> {
            const prepPercentageAll = await this.getPrepPercentageFull(prep);
            const prepPercentageForCase =
                await this.getPrepPercentageForCase(prep, depCase);
            return prepPercentageForCase * 3 < prepPercentageAll;
        },

        // 9. Процент использования падежа для предлога
        async getCasePercentageForPrep(
            prep: string,
            depCase: string
        ): Promise<number> {
            const [result] = await this.query(`
                SELECT 
                    (COUNT(*) FILTER (WHERE dep_case = $1) * 100.0 / 
                    NULLIF(COUNT(*), 0)) AS percentage
                FROM 
                    phrases
                WHERE 
                    preposition = $2
            `, [depCase, prep]);

            return result?.percentage ? parseFloat(result.percentage) : 0;
        },

        async getPrepositionsWithFrequencyQB() {
            const totalCount = await this.count();

            if (totalCount === 0) {
                return [];
            }

            const queryResult = await this.createQueryBuilder("phrase")
                .select("phrase.preposition", "preposition")
                .addSelect("COUNT(*)", "count")
                .addSelect("(COUNT(*) * 100.0 / :totalCount)", "percentage")
                .where("phrase.preposition IS NOT NULL")
                .groupBy("phrase.preposition")
                .orderBy("count", "DESC")
                .setParameter("totalCount", totalCount)
                .getRawMany();

            return queryResult.map(row => ({
                preposition: row.preposition,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage)
            }));
        }
    });