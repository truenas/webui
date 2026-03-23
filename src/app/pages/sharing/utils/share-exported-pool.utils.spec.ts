import {
  getFilesystemAclUnavailableReason,
  getUnavailableReason,
  isShareOnExportedPool,
  isShareUnavailable,
} from 'app/pages/sharing/utils/share-exported-pool.utils';

describe('isShareOnExportedPool', () => {
  it('should return false when activePoolPaths is null (not yet loaded)', () => {
    expect(isShareOnExportedPool('/mnt/exported/data', null)).toBe(false);
  });

  it('should return false for paths not under /mnt/', () => {
    expect(isShareOnExportedPool('/etc/config', ['/mnt/pool'])).toBe(false);
  });

  it('should return true when there are no active pools', () => {
    expect(isShareOnExportedPool('/mnt/exported/data', [])).toBe(true);
  });

  it('should return false when share path matches an active pool path', () => {
    expect(isShareOnExportedPool('/mnt/pool', ['/mnt/pool'])).toBe(false);
  });

  it('should return false when share path is under an active pool', () => {
    expect(isShareOnExportedPool('/mnt/pool/dataset', ['/mnt/pool'])).toBe(false);
  });

  it('should return true when share path is not under any active pool', () => {
    expect(isShareOnExportedPool('/mnt/exported/data', ['/mnt/pool'])).toBe(true);
  });

  it('should not match pool names that are prefixes of other pool names', () => {
    expect(isShareOnExportedPool('/mnt/pool2/data', ['/mnt/pool'])).toBe(true);
  });

  it('should return false for null or undefined paths', () => {
    expect(isShareOnExportedPool(null, ['/mnt/pool'])).toBe(false);
    expect(isShareOnExportedPool(undefined, ['/mnt/pool'])).toBe(false);
  });

  it('should check against multiple active pools', () => {
    const activePools = ['/mnt/pool1', '/mnt/pool2'];
    expect(isShareOnExportedPool('/mnt/pool1/data', activePools)).toBe(false);
    expect(isShareOnExportedPool('/mnt/pool2/data', activePools)).toBe(false);
    expect(isShareOnExportedPool('/mnt/pool3/data', activePools)).toBe(true);
  });
});

describe('isShareUnavailable', () => {
  it('should return true when share is locked', () => {
    expect(isShareUnavailable({ locked: true, path: '/mnt/pool/data' }, ['/mnt/pool'])).toBe(true);
  });

  it('should return true when share is on an exported pool', () => {
    expect(isShareUnavailable({ locked: false, path: '/mnt/exported/data' }, ['/mnt/pool'])).toBe(true);
  });

  it('should return false when share is available', () => {
    expect(isShareUnavailable({ locked: false, path: '/mnt/pool/data' }, ['/mnt/pool'])).toBe(false);
  });

  it('should return false when activePoolPaths is null (not yet loaded)', () => {
    expect(isShareUnavailable({ locked: false, path: '/mnt/exported/data' }, null)).toBe(false);
  });

  it('should return true when share is locked even if activePoolPaths is null', () => {
    expect(isShareUnavailable({ locked: true, path: '/mnt/pool/data' }, null)).toBe(true);
  });
});

describe('getUnavailableReason', () => {
  it('should return locked message for locked shares', () => {
    expect(getUnavailableReason({ locked: true, path: '/mnt/pool/data' }, ['/mnt/pool'])).toBe('Dataset is locked');
  });

  it('should return exported pool message for exported pool shares', () => {
    expect(getUnavailableReason({ locked: false, path: '/mnt/exported/data' }, ['/mnt/pool']))
      .toBe('Share is on an exported pool');
  });

  it('should return empty string for available shares', () => {
    expect(getUnavailableReason({ locked: false, path: '/mnt/pool/data' }, ['/mnt/pool'])).toBe('');
  });

  it('should return empty string when activePoolPaths is null', () => {
    expect(getUnavailableReason({ locked: false, path: '/mnt/exported/data' }, null)).toBe('');
  });
});

describe('getFilesystemAclUnavailableReason', () => {
  it('should return root share message for root shares', () => {
    expect(getFilesystemAclUnavailableReason({ locked: false, path: '/mnt/pool' }, ['/mnt/pool']))
      .toBe('This action is not available for root shares');
  });

  it('should return locked message for locked shares', () => {
    expect(getFilesystemAclUnavailableReason({ locked: true, path: '/mnt/pool/data' }, ['/mnt/pool']))
      .toBe('Dataset is locked');
  });

  it('should return exported pool message for exported pool shares', () => {
    expect(getFilesystemAclUnavailableReason({ locked: false, path: '/mnt/exported/data' }, ['/mnt/pool']))
      .toBe('Share is on an exported pool');
  });

  it('should return empty string for available non-root shares', () => {
    expect(getFilesystemAclUnavailableReason({ locked: false, path: '/mnt/pool/data' }, ['/mnt/pool']))
      .toBe('');
  });
});
