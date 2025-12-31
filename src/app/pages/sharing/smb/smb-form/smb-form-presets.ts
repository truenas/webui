import {
  SmbSharePurpose, SmbShareOptions,
} from 'app/interfaces/smb-share.interface';

// Distribute keyof over union to get all possible option keys
type AllOptionKeys<T> = T extends unknown ? keyof T : never;
type OptionKeys = AllOptionKeys<SmbShareOptions>;

export const presetEnabledFields: Partial<Record<SmbSharePurpose, OptionKeys[]>> = {
  [SmbSharePurpose.LegacyShare]: [
    'recyclebin', 'path_suffix', 'hostsallow', 'hostsdeny', 'guestok', 'streams',
    'durablehandle', 'shadowcopy', 'fsrvp', 'home', 'acl', 'afp', 'timemachine',
    'timemachine_quota', 'aapl_name_mangling', 'auxsmbconf', 'vuid',
  ],
  [SmbSharePurpose.DefaultShare]: ['aapl_name_mangling', 'hostsallow', 'hostsdeny'],
  [SmbSharePurpose.TimeMachineShare]: [
    'timemachine_quota', 'vuid', 'auto_snapshot',
    'auto_dataset_creation', 'dataset_naming_schema', 'hostsallow', 'hostsdeny',
  ],
  [SmbSharePurpose.MultiProtocolShare]: ['aapl_name_mangling', 'hostsallow', 'hostsdeny'],
  [SmbSharePurpose.TimeLockedShare]: ['grace_period', 'aapl_name_mangling', 'hostsallow', 'hostsdeny'],
  [SmbSharePurpose.PrivateDatasetsShare]: [
    'dataset_naming_schema', 'auto_quota', 'aapl_name_mangling', 'hostsallow', 'hostsdeny',
  ],
  [SmbSharePurpose.ExternalShare]: ['remote_path'],
  [SmbSharePurpose.VeeamRepositoryShare]: ['hostsallow', 'hostsdeny'],
  [SmbSharePurpose.FcpShare]: ['aapl_name_mangling', 'hostsallow', 'hostsdeny'],
};
