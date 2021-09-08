export interface ResilverConfig {
  begin: string;
  enabled: boolean;
  end: string;
  id: number;
  weekday: number[];
}

export type ResilverConfigUpdate = Omit<ResilverConfig, 'id'>;
