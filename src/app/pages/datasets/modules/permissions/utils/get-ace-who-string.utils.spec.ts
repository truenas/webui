import { NfsAclItem } from 'app/interfaces/acl.interface';
import { getAceWhoString } from './get-ace-who-string.utils';

describe('getAceWhoString', () => {
  it('returns `who` of an ace when it is available', () => {
    const result = getAceWhoString({ who: 'john' } as NfsAclItem);

    expect(result).toBe('john');
  });

  it('fallbacks to id when id is available, but `who` is not', () => {
    const result = getAceWhoString({ id: 123 } as NfsAclItem);

    expect(result).toBe('123');
  });

  it('returns ? when who is not available and id is -1', () => {
    const result = getAceWhoString({ id: -1 } as NfsAclItem);

    expect(result).toBe('?');
  });

  it('returns ? when nothing is available', () => {
    const result = getAceWhoString({} as NfsAclItem);

    expect(result).toBe('?');
  });
});
