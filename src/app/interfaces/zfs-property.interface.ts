import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';

/**
 * An object that contains both the original value from ZFS
 * and typed value parsed by middleware.
 *
 * @example
 * {
 *   parsed: 131072
 *   rawvalue: "131072"
 *   source: "DEFAULT"
 *   value: "128K"
 * }
 */
export interface ZfsProperty<T> {
  parsed: T;
  rawvalue: string;
  value: string;
  source: ZfsPropertySource;
}
