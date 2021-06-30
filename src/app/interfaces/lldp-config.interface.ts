export interface LldpConfig {
  country: string;
  id: number;
  intdesc: boolean;
  location: string;
}

export type LldpConfigUpdate = Omit<LldpConfig, 'id'>;
