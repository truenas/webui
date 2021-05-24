import { Pool } from 'app/interfaces/pool.interface';

export interface PoolDataEvent {
  name: 'PoolData';
  sender: unknown;
  data: Pool[];
}
