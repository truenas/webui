import { Idmap } from 'app/interfaces/idmap.interface';

export interface IdmapRow extends Idmap {
  label: string;
  disableEdit: boolean;
  cert_name: string;
}
