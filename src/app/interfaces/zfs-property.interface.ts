import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';

/**
 * A ZFS property with both the raw value and middleware's typed parse, e.g.
 * `{ parsed: 131072, rawvalue: "131072", source: "DEFAULT", value: "128K" }`.
 */
export interface ZfsProperty<V, P = unknown> {
  parsed: P;
  rawvalue: string;
  value: V;
  source: ZfsPropertySource;
}
