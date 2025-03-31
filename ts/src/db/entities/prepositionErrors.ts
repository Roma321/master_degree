import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("phrases") // Укажите реальное имя таблицы
export class PrepositionUsage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 30 })
    main_word: string;

    @Column({ type: "varchar", length: 30 })
    main_lemma: string;

    @Column({ type: "varchar", length: 12, nullable: true })
    preposition: string;

    @Column({ type: "varchar", length: 30, nullable: true })
    dep_word: string;

    @Column({ type: "varchar", length: 30, nullable: true })
    dep_lemma: string;

    @Column({ type: "varchar", length: 3, nullable: true })
    dep_case: string;

    @Column({ type: "text", nullable: true })
    context: string;

    @Column({ type: "integer", nullable: true })
    source: number;

    @Column({ type: "varchar", length: 20 })
    main_part_of_speech: string;
}
