import { DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import {
  WebUiDatasetDetailsEntry,
  toDatasetDetails,
} from 'app/services/dataset/webui-dataset-details.utils';

function property(raw: string, value: unknown, source = 'NONE'): unknown {
  return { raw, value, source: { type: source, value: null } };
}

function row(name: string, overrides: Partial<WebUiDatasetDetailsEntry> = {}): WebUiDatasetDetailsEntry {
  return {
    id: name,
    name,
    pool: name.split('/')[0],
    type: 'FILESYSTEM',
    properties: {},
    user_properties: {},
    tier: null,
    snapshot_count: 0,
    thick_provisioned: null,
    consumers: {
      smb: [], nfs: [], webshare: [], iscsi: [], nvmet: [], vms: [], containers: [], apps: [],
    },
    tasks: {
      snapshot: 0, replication: 0, cloudsync: 0, rsync: 0,
    },
    ...overrides,
  } as WebUiDatasetDetailsEntry;
}

describe('toDatasetDetails', () => {
  it('lists every dataset in order and nests each under its parent', () => {
    const datasets = toDatasetDetails([
      row('dozer'),
      row('dozer/a'),
      row('dozer/a/b'),
      row('dozer/c'),
      row('tank'),
    ]);
    const [dozer, first, nested, second, tank] = datasets;

    expect(datasets.map((dataset) => dataset.name)).toEqual(['dozer', 'dozer/a', 'dozer/a/b', 'dozer/c', 'tank']);
    expect(dozer.children).toEqual([first, second]);
    expect(first.children).toEqual([nested]);
    expect(nested.children).toEqual([]);
    expect(tank.children).toEqual([]);
  });

  it('nests a dataset whose parent is not listed under its nearest listed ancestor', () => {
    const [dozer, visible] = toDatasetDetails([row('dozer'), row('dozer/hidden/visible')]);

    expect(dozer.children).toEqual([visible]);
  });

  it('reads native properties into the shape the datasets page uses', () => {
    const [dataset] = toDatasetDetails([row('dozer/a', {
      properties: {
        used: property('2147483648', 2147483648),
        quota: property('0', 0, 'DEFAULT'),
        compression: property('lz4', 'lz4', 'INHERITED'),
        compressratio: property('1.87', 1.87),
        dedup: property('off', 'off', 'DEFAULT'),
        atime: property('off', 'off', 'LOCAL'),
        mountpoint: property('/mnt/dozer/a', '/mnt/dozer/a', 'DEFAULT'),
        usedbysnapshots: property('1024', 1024),
      } as WebUiDatasetDetailsEntry['properties'],
    })]);

    expect(dataset).toMatchObject({
      id: 'dozer/a',
      pool: 'dozer',
      type: DatasetType.Filesystem,
      mountpoint: '/mnt/dozer/a',
      encrypted: false,
      locked: false,
      encryption_root: null,
      used: {
        parsed: 2147483648, rawvalue: '2147483648', value: '2 GiB', source: ZfsPropertySource.None,
      },
      quota: { parsed: null, value: null, source: ZfsPropertySource.Default },
      compression: { value: 'LZ4', source: ZfsPropertySource.Inherited },
      compressratio: { parsed: '1.87', value: '1.87x' },
      deduplication: { parsed: 'off', value: 'OFF' },
      atime: { parsed: false, value: 'OFF', source: ZfsPropertySource.Local },
      usedbysnapshots: { parsed: 1024, value: '1 KiB' },
    });
  });

  it('derives the encryption state from the encryption properties', () => {
    const [locked, zvol] = toDatasetDetails([
      row('dozer/locked', {
        properties: {
          encryption: property('aes-256-gcm', 'aes-256-gcm'),
          encryptionroot: property('dozer/locked', 'dozer/locked'),
          keystatus: property('unavailable', 'unavailable'),
          keyformat: property('passphrase', 'passphrase'),
        } as WebUiDatasetDetailsEntry['properties'],
      }),
      row('dozer/zvol', { type: 'VOLUME', thick_provisioned: true }),
    ]);

    expect(locked).toMatchObject({
      encrypted: true,
      locked: true,
      key_loaded: false,
      encryption_root: 'dozer/locked',
      encryption_algorithm: { value: 'AES-256-GCM' },
      key_format: { value: 'PASSPHRASE' },
    });
    expect(zvol).toMatchObject({ type: DatasetType.Volume, mountpoint: null, thick_provisioned: true });
  });

  it('moves consumers, task counts and user properties to their top-level fields', () => {
    const smb = [{ enabled: true, path: '/mnt/dozer/a', share_name: 'a' }];
    const [dataset] = toDatasetDetails([row('dozer/a', {
      snapshot_count: 3,
      user_properties: { comments: 'demo' },
      consumers: {
        smb, nfs: [], webshare: [], iscsi: [], nvmet: [], vms: [], containers: [], apps: [],
      },
      tasks: {
        snapshot: 1, replication: 2, cloudsync: 3, rsync: 4,
      },
    })]);

    expect(dataset).toMatchObject({
      snapshot_count: 3,
      smb_shares: smb,
      nfs_shares: [],
      snapshot_tasks_count: 1,
      replication_tasks_count: 2,
      cloudsync_tasks_count: 3,
      rsync_tasks_count: 4,
      user_properties: {
        comments: {
          parsed: 'demo', rawvalue: 'demo', value: 'demo', source: ZfsPropertySource.Local,
        },
      },
    });
  });

  it('keeps a section the user may not see as null', () => {
    const [dataset] = toDatasetDetails([row('dozer/a', {
      snapshot_count: null,
      consumers: {
        smb: null, nfs: [], webshare: [], iscsi: null, nvmet: [], vms: null, containers: [], apps: [],
      },
      tasks: {
        snapshot: null, replication: 0, cloudsync: null, rsync: 0,
      },
    })]);

    expect(dataset).toMatchObject({
      snapshot_count: null,
      smb_shares: null,
      nfs_shares: [],
      iscsi_shares: null,
      vms: null,
      snapshot_tasks_count: null,
      replication_tasks_count: 0,
      cloudsync_tasks_count: null,
    });
  });
});
