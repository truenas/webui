import { VirtualMemoryUpdate } from 'app/interfaces/reporting.interface';

export interface MemoryStatsEvent {
  name: 'MemoryStats';
  sender: unknown;
  data: MemoryStatsEventData;
}

export type MemoryStatsEventData = VirtualMemoryUpdate & { arc_size?: number };
