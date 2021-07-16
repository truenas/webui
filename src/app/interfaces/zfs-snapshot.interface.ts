import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface ZfsSnapshot {
  name: string;
  dataset: string;
  id: string;
  pool: string;
  properties: {
    [property: string]: ZfsProperty<string | number | boolean | ApiTimestamp>;
    creation: ZfsProperty<ApiTimestamp>;
  };
  retention: any;
  snapshot_name: string;
  type: string; // "SNAPSHOT"
}
