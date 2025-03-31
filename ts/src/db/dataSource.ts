import { DataSource } from "typeorm";
import { PrepositionUsage } from "./entities/prepositionErrors";

export const dataSource = new DataSource({
    type: "postgres", // или другой драйвер
    host: "localhost",
    username: 'postgres',
    password: 'postgres',
    database: 'prepositions',
    entities: [PrepositionUsage],
});

export async function initializeDB() {
    try {
        await dataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (err) {
        console.error("Error during Data Source initialization", err);
    }
}