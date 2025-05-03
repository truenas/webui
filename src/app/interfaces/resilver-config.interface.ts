import { Weekday } from 'app/enums/weekday.enum';

export interface ResilverConfig {
  begin: string;
  enabled: boolean;
  end: string;
  id: number;
  weekday: Weekday[];
}

export type ResilverConfigUpdate = Omit<ResilverConfig, 'id'>;
