import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface BootEnvironment {
  /**
   * The name of the boot environment.
   */
  id: string;

  /**
   * The name of the dataset representing the boot environment.
   */
  dataset: string;

  /**
   * If `true`, represents the `currently` running boot environment.
   */
  active: boolean;

  /**
   * If `true`, represents the boot environment that will become the running boot environment at `next boot`.
   */
  activated: boolean;

  /**
   * Represents when the boot environment was created.
   */
  created: ApiTimestamp;

  /**
   * An integer representing the number of bytes used by the boot environment.
   */
  used_bytes: number;

  /**
   * A human-readable string representing the total number of space used by the boot environment.
   */
  used: string;

  /**
   * When set to `false`, will be automatically deleted during an upgrade procedure
   * if there isn’t enough room on the boot drive to apply said update.
   */
  keep: boolean;

  /**
   * If `true` indicates whether the boot environment may be `activated`.
   */
  can_activate: boolean;
}

export type BootenvCloneParams = [{
  id: string;
  target: string;
}];

export type BootenvKeepParams = [{
  id: string;
  value: boolean;
}];
