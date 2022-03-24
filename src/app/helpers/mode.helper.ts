import { PosixPermission } from 'app/enums/posix-acl.enum';
import { UnixFilePermissions } from 'app/interfaces/posix-permissions.interface';

/**
 * Converts unix octal permission (usually coming from API) to an object.
 */
export function parseApiMode(apiMode: number): UnixFilePermissions {
  const mode = apiMode.toString(8).substring(2, 5);

  return parseMode(mode);
}

/**
 * Converts unix permissions of 764 to an object.
 */
export function parseMode(mode: string): UnixFilePermissions {
  const canRead = 0b100;
  const canWrite = 0b010;
  const canExecute = 0b001;

  const owner = parseInt(mode[0]);
  const group = parseInt(mode[1]);
  const other = parseInt(mode[2]);

  return {
    owner: {
      [PosixPermission.Read]: Boolean(owner & canRead),
      [PosixPermission.Write]: Boolean(owner & canWrite),
      [PosixPermission.Execute]: Boolean(owner & canExecute),
    },
    group: {
      [PosixPermission.Read]: Boolean(group & canRead),
      [PosixPermission.Write]: Boolean(group & canWrite),
      [PosixPermission.Execute]: Boolean(group & canExecute),
    },
    other: {
      [PosixPermission.Read]: Boolean(other & canRead),
      [PosixPermission.Write]: Boolean(other & canWrite),
      [PosixPermission.Execute]: Boolean(other & canExecute),
    },
  };
}

export function invertUmask(umask: string): string {
  const perm = parseInt(umask, 8);
  let mask = (~perm & 0o777).toString(8);
  while (mask.length < 3) {
    mask = '0' + mask;
  }

  return mask;
}
