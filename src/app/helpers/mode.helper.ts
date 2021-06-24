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
  const owner = parseInt(mode[0]);
  const group = parseInt(mode[1]);
  const other = parseInt(mode[2]);

  return {
    owner: {
      [PosixPermission.Read]: owner - 4 >= 0,
      [PosixPermission.Write]: owner - 2 >= 0,
      [PosixPermission.Execute]: owner - 1 >= 0,
    },
    group: {
      [PosixPermission.Read]: group - 4 >= 0,
      [PosixPermission.Write]: group - 2 >= 0,
      [PosixPermission.Execute]: group - 1 >= 0,
    },
    other: {
      [PosixPermission.Read]: other - 4 >= 0,
      [PosixPermission.Write]: other - 2 >= 0,
      [PosixPermission.Execute]: other - 1 >= 0,
    },
  };
}
