import { DatasetChecksum } from 'app/enums/dataset-checksum.enum';

export interface DatasetFormData {
  name: string;
  acltype?: string;
  comments: string;
  sync: string;
  compression: string;
  atime: string;
  share_type: string;
  aclmode?: string;
  refquota: number;
  refquota_unit?: string;
  quota: number;
  quota_unit?: string;
  refreservation: number;
  refreservation_unit?: string;
  reservation: number;
  reservation_unit?: string;
  deduplication: string;
  exec: string;
  readonly: string;
  snapdir: string;
  copies: string;
  recordsize: string;
  casesensitivity: string;
  quota_warning: number;
  quota_warning_inherit: boolean;
  quota_critical: number;
  quota_critical_inherit: boolean;
  refquota_warning: number;
  refquota_warning_inherit: boolean;
  refquota_critical: number;
  refquota_critical_inherit: boolean;
  special_small_block_size: number;
  checksum: DatasetChecksum;
}
