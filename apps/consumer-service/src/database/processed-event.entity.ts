import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
    @PrimaryColumn({ type: 'uuid' })
    eventId: string;

    @Column()
    status: string;

    @CreateDateColumn()
    processedAt: Date;
}