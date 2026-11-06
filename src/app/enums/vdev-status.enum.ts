export enum TopologyItemStatus {
  /** Healthy. Applies to the pool, top-level vdevs and drives; transient errors can occur without a state change. */
  Online = 'ONLINE',
  /** Drives only: taken offline by an administrator, and can be brought back online. */
  Offline = 'OFFLINE',
  /** The device can't be opened. An UNAVAIL vdev makes the pool inaccessible; treat like FAULTED. */
  Unavail = 'UNAVAIL',
  /** A fault below affects this vdev. The pool still works, but redundancy may be lost. */
  Degraded = 'DEGRADED',
  /** Physically removed while running. Detection depends on the hardware. */
  Removed = 'REMOVED',
  /** Completely inaccessible. Any component, from the pool down to a drive, can be FAULTED. */
  Faulted = 'FAULTED',
  /** A spare that has replaced a faulted drive. */
  Inuse = 'INUSE',
}
