import { AclMode } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  DatasetChecksum,
  DatasetSnapdev,
  DatasetSnapdir,
  DatasetSync,
  DatasetType,
  DatasetXattr,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';

export function mockRootDataset(poolName: string): Dataset {
  const output: Dataset = {
    id: poolName,
    type: DatasetType.Filesystem,
    name: poolName,
    pool: poolName,
    encrypted: false,
    encryption_root: null,
    key_loaded: false,
    deduplication: {
      parsed: 'off',
      rawvalue: 'off',
      value: DeduplicationSetting.Off,
      source: ZfsPropertySource.Default,
    },
    mountpoint: '/mnt/POOLNAME',
    aclmode: {
      parsed: 'discard',
      rawvalue: 'discard',
      value: AclMode.Discard,
      source: ZfsPropertySource.Local,
    },
    acltype: {
      parsed: 'posix',
      rawvalue: 'posix',
      value: DatasetAclType.Posix,
      source: ZfsPropertySource.Local,
    },
    xattr: {
      parsed: true,
      rawvalue: 'on',
      value: DatasetXattr.On,
      source: ZfsPropertySource.Default,
    },
    atime: {
      parsed: false,
      rawvalue: 'off',
      value: OnOff.Off,
      source: ZfsPropertySource.Local,
    },
    casesensitivity: {
      parsed: 'sensitive',
      rawvalue: 'sensitive',
      value: DatasetCaseSensitivity.Sensitive,
      source: ZfsPropertySource.None,
    },
    checksum: {
      parsed: true,
      rawvalue: 'on',
      value: DatasetChecksum.On,
      source: ZfsPropertySource.Default,
    },
    exec: {
      parsed: true,
      rawvalue: 'on',
      value: OnOff.On,
      source: ZfsPropertySource.Default,
    },
    sync: {
      parsed: 'standard',
      rawvalue: 'standard',
      value: DatasetSync.Standard,
      source: ZfsPropertySource.Default,
    },
    compression: {
      parsed: 'lz4',
      rawvalue: 'lz4',
      value: 'LZ4',
      source: ZfsPropertySource.Local,
    },
    compressratio: {
      parsed: '1.00',
      rawvalue: '1.00',
      value: '1.00x',
      source: ZfsPropertySource.None,
    },
    origin: {
      parsed: '',
      rawvalue: '',
      value: '',
      source: ZfsPropertySource.None,
    },
    quota: {
      parsed: null,
      rawvalue: '0',
      value: null,
      source: ZfsPropertySource.Default,
    },
    refquota: {
      parsed: null,
      rawvalue: '0',
      value: null,
      source: ZfsPropertySource.Default,
    },
    reservation: {
      parsed: null,
      rawvalue: '0',
      value: null,
      source: ZfsPropertySource.Default,
    },
    refreservation: {
      parsed: null,
      rawvalue: '0',
      value: null,
      source: ZfsPropertySource.Default,
    },
    copies: {
      parsed: 1,
      rawvalue: '1',
      value: '1',
      source: ZfsPropertySource.Default,
    },
    snapdir: {
      parsed: null,
      rawvalue: 'hidden',
      value: DatasetSnapdir.Hidden,
      source: ZfsPropertySource.Default,
    },
    readonly: {
      parsed: false,
      rawvalue: 'off',
      value: OnOff.Off,
      source: ZfsPropertySource.Default,
    },
    recordsize: {
      parsed: 131072,
      rawvalue: '131072',
      value: '128K',
      source: ZfsPropertySource.Default,
    },
    key_format: {
      parsed: 'none',
      rawvalue: 'none',
      value: null,
      source: ZfsPropertySource.Default,
    },
    encryption_algorithm: {
      parsed: 'off',
      rawvalue: 'off',
      value: null,
      source: ZfsPropertySource.Default,
    },
    used: {
      parsed: 430080,
      rawvalue: '430080',
      value: '420K',
      source: ZfsPropertySource.None,
    },
    usedbychildren: {
      parsed: 331776,
      rawvalue: '331776',
      value: '324K',
      source: ZfsPropertySource.None,
    },
    usedbydataset: {
      parsed: 98304,
      rawvalue: '98304',
      value: '96K',
      source: ZfsPropertySource.None,
    },
    usedbyrefreservation: {
      parsed: 0,
      rawvalue: '0',
      value: '0B',
      source: ZfsPropertySource.None,
    },
    usedbysnapshots: {
      parsed: 0,
      rawvalue: '0',
      value: '0B',
      source: ZfsPropertySource.None,
    },
    available: {
      parsed: 5720600576,
      rawvalue: '5720600576',
      value: '5.33G',
      source: ZfsPropertySource.None,
    },
    special_small_block_size: {
      parsed: '0',
      rawvalue: '0',
      value: '0',
      source: ZfsPropertySource.Default,
    },
    pbkdf2iters: {
      parsed: '0',
      rawvalue: '0',
      value: '0',
      source: ZfsPropertySource.Default,
    },
    snapdev: {
      parsed: 'hidden',
      rawvalue: 'hidden',
      value: DatasetSnapdev.Hidden,
      source: ZfsPropertySource.Default,
    },
    locked: false,
    managedby: null,
    share_type: null,
  };

  return output;
}
