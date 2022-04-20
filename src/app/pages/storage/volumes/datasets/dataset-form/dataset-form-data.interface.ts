import { AclMode } from 'app/enums/acl-type.enum';
import {
  DatasetAclType, DatasetRecordSize, DatasetSnapdir, DatasetSync,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { WithInherit } from 'app/enums/with-inherit.enum';

export interface DatasetFormData {
  name: string;
  acltype?: DatasetAclType;
  comments: string;
  sync: DatasetSync;
  compression: string;
  atime: WithInherit<OnOff>;
  share_type: string;
  aclmode?: AclMode;
  refquota: number;
  refquota_unit?: string;
  quota: number;
  quota_unit?: string;
  refreservation: number;
  refreservation_unit?: string;
  reservation: number;
  reservation_unit?: string;
  deduplication: DeduplicationSetting;
  exec: WithInherit<OnOff>;
  readonly: WithInherit<OnOff>;
  snapdir: DatasetSnapdir;
  copies: WithInherit<number>;
  recordsize: WithInherit<DatasetRecordSize>;
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
}
