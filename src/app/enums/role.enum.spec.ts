import { formatRoleNames, Role, roleNames } from 'app/enums/role.enum';

describe('formatRoleNames', () => {
  // Mirrors TranslateService.instant: echoes the key it can't find, which is enough to assert
  // which keys make it through (and that none of them is an empty string).
  const translate = (key: string): string => key;

  it('maps known roles to their human-readable names', () => {
    expect(formatRoleNames([Role.FullAdmin], translate))
      .toBe(roleNames.get(Role.FullAdmin) as string);
  });

  it('joins multiple roles with a comma', () => {
    expect(formatRoleNames([Role.SshRead, Role.SshWrite], translate))
      .toBe([roleNames.get(Role.SshRead), roleNames.get(Role.SshWrite)].join(', '));
  });

  it('falls back to the raw role for names not present in roleNames', () => {
    expect(formatRoleNames(['SOME_UNMAPPED_ROLE' as Role], translate)).toBe('SOME_UNMAPPED_ROLE');
  });

  it('drops null entries so an empty key is never handed to translate', () => {
    const spy = jest.fn((key: string) => key);

    expect(formatRoleNames([null, Role.SshRead, null], spy))
      .toBe(roleNames.get(Role.SshRead) as string);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalledWith('');
  });

  it('returns an empty string when there are no real roles', () => {
    expect(formatRoleNames([null], translate)).toBe('');
  });
});
