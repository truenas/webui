import { IdmapBackend, IdmapName } from 'app/enums/idmap.enum';

export interface Idmap {
  certificate: {
    id: number;
    cert_name: string;
  };
  dns_domain_name: string;
  id: number;
  idmap_backend: IdmapBackend;
  name: IdmapName | string;
  options: Record<string, unknown>;
  range_high: number;
  range_low: number;
}

export type IdmapUpdate = Omit<Idmap, 'id' | 'certificate'> & {
  certificate: number;
};
