import { isRootShare } from 'app/pages/sharing/utils/smb.utils';

describe('isRootShare', () => {
  it('returns true when path is root share', () => {
    const path = '/mnt/test';
    expect(isRootShare(path)).toBe(true);
  });

  it('returns false when path is not root share', () => {
    const path = '/mnt/test/test';
    expect(isRootShare(path)).toBe(false);
  });
});
