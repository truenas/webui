import { DatasetPreset, DatasetType } from 'app/enums/dataset.enum';
import { DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import {
  formatBlockSize,
  formatZfsSize,
  parseBlockSize,
  toLegacyZfsProperty,
  toUpperCaseChoices,
  toZfsResourceCreate,
  toZfsResourceSet,
  ZfsResourceEntry,
  zfsResourceToDataset,
} from 'app/services/dataset/zfs-resource.utils';

function prop(raw: string, value: unknown = raw, source = 'DEFAULT', sourceValue: string | null = null): unknown {
  return { raw, value, source: { type: source, value: sourceValue } };
}

const rootRow = {
  createtxg: 1,
  guid: 1,
  name: 'dozer',
  pool: 'dozer',
  type: 'FILESYSTEM',
  properties: {
    atime: prop('on', 'on', 'LOCAL'),
    casesensitivity: prop('sensitive', 'sensitive', 'NONE'),
    mounted: prop('yes', true, 'NONE'),
    mountpoint: prop('/mnt/dozer'),
    quota: prop('0', 0),
    refquota: prop('2147483648', 2147483648, 'LOCAL'),
    recordsize: prop('131072', 131072),
    used: prop('1536', 1536, 'NONE'),
    compression: prop('lz4', 'lz4', 'LOCAL'),
    compressratio: prop('2.04', 2.04, 'NONE'),
    copies: prop('1', '1'),
    dedup: prop('off'),
    encryption: prop('off'),
    encryptionroot: prop('none', null, 'NONE'),
    keyformat: prop('none', null),
    keystatus: prop('none', null, 'NONE'),
    origin: prop('none', null, 'NONE'),
    sync: prop('standard', 'standard', 'INHERITED', 'dozer'),
  },
  user_properties: { comments: 'hello' },
  children: null,
} as unknown as ZfsResourceEntry;

describe('zfs-resource utils', () => {
  describe('formatZfsSize', () => {
    it('formats bytes the way pool.dataset.query did', () => {
      expect(formatZfsSize(1)).toBe('1 byte');
      expect(formatZfsSize(512)).toBe('512 bytes');
      expect(formatZfsSize(1024)).toBe('1 KiB');
      expect(formatZfsSize(1536)).toBe('1.5 KiB');
      expect(formatZfsSize(2147483648)).toBe('2 GiB');
    });
  });

  describe('formatBlockSize and parseBlockSize', () => {
    it('formats block sizes', () => {
      expect(formatBlockSize(512)).toBe('512');
      expect(formatBlockSize(16384)).toBe('16K');
      expect(formatBlockSize(131072)).toBe('128K');
      expect(formatBlockSize(1048576)).toBe('1M');
    });

    it('parses block sizes', () => {
      expect(parseBlockSize('512')).toBe(512);
      expect(parseBlockSize('512B')).toBe(512);
      expect(parseBlockSize('16K')).toBe(16384);
      expect(parseBlockSize('1M')).toBe(1048576);
      expect(parseBlockSize(4096)).toBe(4096);
      expect(() => parseBlockSize('big')).toThrow();
    });
  });

  describe('toLegacyZfsProperty', () => {
    it('reads on/off properties as booleans with an upper-case value', () => {
      expect(toLegacyZfsProperty('atime', prop('on', 'on', 'LOCAL') as never)).toEqual({
        parsed: true, rawvalue: 'on', value: 'ON', source: 'LOCAL',
      });
      expect(toLegacyZfsProperty('readonly', prop('off') as never)).toMatchObject({ parsed: false, value: 'OFF' });
    });

    it('reads an unset quota as null and a set one as a formatted size', () => {
      expect(toLegacyZfsProperty('quota', prop('0', 0) as never)).toMatchObject({ parsed: null, value: null });
      expect(toLegacyZfsProperty('quota', prop('2147483648', 2147483648) as never))
        .toMatchObject({ parsed: 2147483648, value: '2 GiB' });
    });

    it('formats record sizes and compress ratios', () => {
      expect(toLegacyZfsProperty('recordsize', prop('131072', 131072) as never))
        .toMatchObject({ parsed: 131072, value: '128K' });
      expect(toLegacyZfsProperty('compressratio', prop('2.04', 2.04) as never)).toMatchObject({ value: '2.04x' });
    });

    it('reads origin "none" as empty', () => {
      expect(toLegacyZfsProperty('origin', prop('none', null) as never))
        .toEqual({
          parsed: '', rawvalue: '', value: '', source: 'DEFAULT',
        });
    });

    it('uses NONE when there is no source', () => {
      expect(toLegacyZfsProperty('sync', { raw: 'standard', value: 'standard', source: null } as never))
        .toMatchObject({ value: 'STANDARD', source: 'NONE' });
    });
  });

  describe('zfsResourceToDataset', () => {
    it('reads a row into the legacy Dataset shape', () => {
      const dataset = zfsResourceToDataset(rootRow);

      expect(dataset).toMatchObject({
        id: 'dozer',
        name: 'dozer',
        pool: 'dozer',
        type: DatasetType.Filesystem,
        mountpoint: '/mnt/dozer',
        encrypted: false,
        locked: false,
        key_loaded: false,
        encryption_root: null,
      });
      expect(dataset.compression).toEqual({
        parsed: 'lz4', rawvalue: 'lz4', value: 'LZ4', source: 'LOCAL',
      });
      expect(dataset.deduplication).toMatchObject({ value: 'OFF' });
      expect(dataset.encryption_algorithm).toMatchObject({ value: null });
      expect(dataset.key_format).toMatchObject({ value: null });
      expect(dataset.mounted).toMatchObject({ parsed: true, value: 'YES' });
      expect(dataset.refquota).toMatchObject({ parsed: 2147483648, value: '2 GiB' });
      expect(dataset.origin).toMatchObject({ parsed: '', value: '' });
      expect(dataset.sync).toMatchObject({ value: 'STANDARD', source: 'INHERITED' });
      expect(dataset.user_properties).toEqual({
        comments: {
          parsed: 'hello', rawvalue: 'hello', value: 'hello', source: 'LOCAL',
        },
      });
      expect(dataset.children).toBeUndefined();
    });

    it('derives the encryption fields of a locked passphrase-encrypted dataset', () => {
      const dataset = zfsResourceToDataset({
        ...rootRow,
        name: 'dozer/nas145308-pass',
        properties: {
          encryption: prop('aes-256-gcm'),
          encryptionroot: prop('dozer/nas145308-pass'),
          keyformat: prop('passphrase'),
          keystatus: prop('unavailable'),
          mountpoint: prop('/mnt/dozer/nas145308-pass'),
        },
      } as unknown as ZfsResourceEntry);

      expect(dataset).toMatchObject({
        encrypted: true,
        locked: true,
        key_loaded: false,
        encryption_root: 'dozer/nas145308-pass',
      });
      expect(dataset.key_format).toMatchObject({ value: 'PASSPHRASE' });
    });

    it('reports a loaded key as unlocked', () => {
      const dataset = zfsResourceToDataset({
        ...rootRow,
        properties: {
          encryption: prop('aes-256-gcm'),
          encryptionroot: prop('dozer'),
          keyformat: prop('hex'),
          keystatus: prop('available'),
        },
      } as unknown as ZfsResourceEntry);

      expect(dataset).toMatchObject({ encrypted: true, locked: false, key_loaded: true });
    });

    it('has no mountpoint for a volume and reads its block size', () => {
      const dataset = zfsResourceToDataset({
        ...rootRow,
        name: 'dozer/nas145308-zvol',
        type: 'VOLUME',
        properties: {
          volblocksize: prop('16384', 16384),
          volsize: prop('1073741824', 1073741824, 'LOCAL'),
        },
        user_properties: null,
      } as unknown as ZfsResourceEntry);

      expect(dataset.mountpoint).toBeNull();
      expect(dataset.volblocksize).toMatchObject({ parsed: 16384, value: '16K' });
      expect(dataset.volsize).toMatchObject({ parsed: 1073741824, value: '1 GiB' });
      expect(dataset.user_properties).toBeUndefined();
    });

    it('reads nested children', () => {
      const dataset = zfsResourceToDataset({
        ...rootRow,
        children: [{ ...rootRow, name: 'dozer/child', children: [] }],
      } as unknown as ZfsResourceEntry);

      expect(dataset.children).toHaveLength(1);
      expect(dataset.children![0]).toMatchObject({ name: 'dozer/child', children: [] });
    });
  });

  describe('toZfsResourceCreate', () => {
    it('translates a filesystem payload, leaving INHERIT out', () => {
      expect(toZfsResourceCreate({
        name: 'dozer/nas145308-new-plain',
        comments: 'hello',
        sync: 'ALWAYS',
        compression: 'ZSTD',
        atime: 'ON',
        exec: 'OFF',
        quota: 2147483648,
        refquota: 1073741824,
        reservation: 104857600,
        copies: 2,
        snapdir: 'VISIBLE',
        readonly: 'OFF',
        recordsize: '1M',
        checksum: 'SHA256',
        quota_warning: 70,
        quota_critical: 90,
        special_small_block_size: 65536,
        deduplication: 'INHERIT',
        acltype: 'INHERIT',
        aclmode: 'INHERIT',
        share_type: DatasetPreset.Generic,
        create_ancestors: true,
      } as DatasetCreate)).toEqual({
        path: 'dozer/nas145308-new-plain',
        type: 'FILESYSTEM',
        properties: {
          sync: 'always',
          compression: 'zstd',
          atime: 'on',
          exec: 'off',
          quota: 2147483648,
          refquota: 1073741824,
          reservation: 104857600,
          copies: 2,
          snapdir: 'visible',
          readonly: 'off',
          recordsize: 1048576,
          checksum: 'sha256',
          special_small_blocks: 65536,
        },
        user_properties: {
          'org.freenas:description': 'hello',
          'org.freenas:quota_warning': '70',
          'org.freenas:quota_critical': '90',
        },
        create_ancestors: true,
        share_type: null,
        force_size: false,
      });
    });

    it('sends a share preset in lower case', () => {
      expect(toZfsResourceCreate({ name: 'dozer/a', share_type: DatasetPreset.Smb } as DatasetCreate))
        .toMatchObject({ share_type: 'smb', properties: {} });
    });

    it('creates a sparse zvol without a reservation', () => {
      expect(toZfsResourceCreate({
        name: 'dozer/zvol',
        type: DatasetType.Volume,
        volsize: 1073741824,
        volblocksize: '16K',
        sparse: true,
      } as DatasetCreate)).toMatchObject({
        type: 'VOLUME',
        properties: { volsize: 1073741824, volblocksize: 16384, refreservation: 0 },
      });
    });

    it('passes encryption options only when encryption is on', () => {
      const encryptionOptions = { passphrase: 'testtest1', pbkdf2iters: 1300000 };
      expect(toZfsResourceCreate({
        name: 'dozer/enc', encryption: true, encryption_options: encryptionOptions,
      } as DatasetCreate).encryption).toEqual(encryptionOptions);
      expect(toZfsResourceCreate({
        name: 'dozer/plain', encryption: false, encryption_options: encryptionOptions,
      } as DatasetCreate)).not.toHaveProperty('encryption');
    });

    it('adds custom user properties', () => {
      expect(toZfsResourceCreate({
        name: 'dozer/a', user_properties: [{ key: 'my:prop', value: 'x' }],
      } as DatasetCreate).user_properties).toEqual({ 'my:prop': 'x' });
    });
  });

  describe('cleared user properties', () => {
    it('leaves a cleared alert threshold unset on create instead of writing "null"', () => {
      const args = toZfsResourceCreate({ name: 'dozer/new', quota_warning: null, quota_critical: 90 } as unknown as DatasetCreate);

      expect(args.user_properties).toEqual({ 'org.freenas:quota_critical': '90' });
    });

    it('inherits a cleared alert threshold on update instead of writing "null"', () => {
      const args = toZfsResourceSet('dozer/data', { refquota_warning: null } as unknown as DatasetUpdate);

      expect(args.user_properties).toEqual({});
      expect(args.inherit).toEqual(['org.freenas:refquota_warning']);
    });

    it('still writes an empty comment, which keeps the parent\'s from showing through', () => {
      expect(toZfsResourceSet('dozer/data', { comments: '' }).user_properties).toEqual({ 'org.freenas:description': '' });
    });
  });

  describe('toZfsResourceSet', () => {
    it('puts INHERIT into inherit, user properties included', () => {
      expect(toZfsResourceSet('dozer/nas145308-new-plain', {
        sync: 'INHERIT',
        atime: 'OFF',
        recordsize: '128K',
        quota: 0,
        comments: 'changed',
        quota_warning: 'INHERIT',
        quota_critical: 80,
        special_small_block_size: 'INHERIT',
        deduplication: 'VERIFY',
        acltype: 'NFSV4',
      } as DatasetUpdate)).toEqual({
        path: 'dozer/nas145308-new-plain',
        properties: {
          atime: 'off', recordsize: 131072, quota: 0, dedup: 'verify', acltype: 'nfsv4',
        },
        user_properties: { 'org.freenas:description': 'changed', 'org.freenas:quota_critical': '80' },
        inherit: ['sync', 'org.freenas:quota_warning', 'special_small_blocks'],
        force_size: false,
      });
    });

    it('does not inherit quotas or reservations', () => {
      expect(toZfsResourceSet('dozer/a', { quota: 'INHERIT', refreservation: 'INHERIT' } as unknown as DatasetUpdate))
        .toMatchObject({ properties: {}, inherit: [] });
    });

    it('writes or removes custom user properties', () => {
      expect(toZfsResourceSet('dozer/a', {
        user_properties_update: [{ key: 'my:a', value: '1' }, { key: 'my:b', value: '', remove: true }],
        force_size: true,
      } as DatasetUpdate)).toMatchObject({
        user_properties: { 'my:a': '1' },
        inherit: ['my:b'],
        force_size: true,
      });
    });
  });

  describe('toUpperCaseChoices', () => {
    it('upper-cases keys and values', () => {
      expect(toUpperCaseChoices({ lz4: 'lz4', 'gzip-9': 'gzip-9' })).toEqual({ LZ4: 'LZ4', 'GZIP-9': 'GZIP-9' });
    });
  });
});
