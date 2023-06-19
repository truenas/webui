import { VirtualMemoryUpdate } from 'app/interfaces/reporting.interface';

export type MemoryStatsEventData = VirtualMemoryUpdate & { arc_size?: number };
