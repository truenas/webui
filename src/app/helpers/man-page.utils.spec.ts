import { getManPageLink } from 'app/helpers/man-page.utils';

describe('getManPageLink', () => {
  it('returns a link to a man page when term is specified without section', () => {
    expect(getManPageLink('ping'))
      .toBe('<a href="http://manpages.org/ping/" target="_blank">ping</a>');
  });

  it('returns a link to a man page when term is specified with section', () => {
    expect(getManPageLink('zfs(8)'))
      .toBe('<a href="http://manpages.org/zfs/8" target="_blank">zfs(8)</a>');
  });

  it('returns a link to a man page when term contains dot', () => {
    expect(getManPageLink('smb.conf(5)'))
      .toBe('<a href="http://manpages.org/smbconf/5" target="_blank">smb.conf(5)</a>');
  });
});
