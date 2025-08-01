import {
  SmbSharePurpose, SmbShare,
} from 'app/interfaces/smb-share.interface';

export const presetEnabledFields: Partial<{
  [T in SmbSharePurpose]: (keyof Extract<SmbShare, { purpose: T }>['options'])[]
}> = {
  [SmbSharePurpose.LegacyShare]: [
    'recyclebin', 'path_suffix', 'hostsallow', 'hostsdeny', 'guestok', 'streams',
    'durablehandle', 'shadowcopy', 'fsrvp', 'home', 'acl', 'afp', 'timemachine',
    'timemachine_quota', 'aapl_name_mangling', 'auxsmbconf', 'vuid',
  ],
  [SmbSharePurpose.DefaultShare]: ['aapl_name_mangling'],
  [SmbSharePurpose.TimeMachineShare]: [
    'timemachine_quota', 'vuid', 'auto_snapshot',
    'auto_dataset_creation', 'dataset_naming_schema',
  ],
  [SmbSharePurpose.MultiProtocolShare]: ['aapl_name_mangling'],
  [SmbSharePurpose.TimeLockedShare]: ['grace_period', 'aapl_name_mangling'],
  [SmbSharePurpose.PrivateDatasetsShare]: [
    'dataset_naming_schema', 'auto_quota', 'aapl_name_mangling',
  ],
  [SmbSharePurpose.ExternalShare]: ['remote_path'],
  [SmbSharePurpose.VeeamRepositoryShare]: [],
};
