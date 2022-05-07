import { PosixPermission } from 'app/enums/posix-acl.enum';
import { parseMode } from './mode.helper';

describe('parseMode', () => {
  it('returns correct permissions when everything is allowed', () => {
    expect(parseMode('777')).toEqual({
      owner: {
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: true,
        [PosixPermission.Execute]: true,
      },
      group: {
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: true,
        [PosixPermission.Execute]: true,
      },
      other: {
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: true,
        [PosixPermission.Execute]: true,
      },
    });
  });

  it('returns correct permissions when everything is disallowed', () => {
    expect(parseMode('000')).toEqual({
      owner: {
        [PosixPermission.Read]: false,
        [PosixPermission.Write]: false,
        [PosixPermission.Execute]: false,
      },
      group: {
        [PosixPermission.Read]: false,
        [PosixPermission.Write]: false,
        [PosixPermission.Execute]: false,
      },
      other: {
        [PosixPermission.Read]: false,
        [PosixPermission.Write]: false,
        [PosixPermission.Execute]: false,
      },
    });
  });

  it('returns correct permissions when some actions are allowed', () => {
    expect(parseMode('461')).toEqual({
      owner: {
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: false,
        [PosixPermission.Execute]: false,
      },
      group: {
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: true,
        [PosixPermission.Execute]: false,
      },
      other: {
        [PosixPermission.Read]: false,
        [PosixPermission.Write]: false,
        [PosixPermission.Execute]: true,
      },
    });
  });
});
