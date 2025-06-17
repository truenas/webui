import { SmbPresetType, SmbShareUpdate } from 'app/interfaces/smb-share.interface';

export const presetEnabledFields: Partial<Record<SmbPresetType, (keyof SmbShareUpdate)[]>> = {
  [SmbPresetType.LegacyShare]: [
    'recyclebin', 'path_suffix', 'hostsallow', 'hostsdeny', 'guestok', 'streams',
    'durablehandle', 'shadowcopy', 'fsrvp', 'home', 'acl', 'afp', 'timemachine',
    'timemachine_quota', 'aapl_name_mangling', 'auxsmbconf', 'vuid',
  ],
  [SmbPresetType.DefaultShare]: ['aapl_name_mangling'],
  [SmbPresetType.TimeMachineShare]: [
    'timemachine_quota', 'vuid', 'auto_snapshot',
    'auto_dataset_creation', 'dataset_naming_schema',
  ],
  [SmbPresetType.MultiProtocolShare]: ['aapl_name_mangling'],
  [SmbPresetType.TimeLockedShare]: ['grace_period', 'aapl_name_mangling'],
  [SmbPresetType.PrivateDatasetsShare]: [
    'dataset_naming_schema', 'auto_quota', 'aapl_name_mangling',
  ],
  [SmbPresetType.ExternalShare]: ['remote_path'],
};
