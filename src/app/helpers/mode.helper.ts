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
      read: owner - 4 >= 0,
      write: owner - 2 >= 0,
      execute: owner - 1 >= 0,
    },
    group: {
      read: group - 4 >= 0,
      write: group - 2 >= 0,
      execute: group - 1 >= 0,
    },
    other: {
      read: other - 4 >= 0,
      write: other - 2 >= 0,
      execute: other - 1 >= 0,
    },
  };
}
