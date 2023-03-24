/*
ONLINE:
All devices can (and should while operating optimally) be in the ONLINE state.
This includes the pool, top-level VDEVs (parity groups of type mirror, raidz{1,2,3})
and the drives themselves. Transitory errors may still occur without the drive changing state.

OFFLINE:
Only bottom-level devices (drives) can be OFFLINE. This is a manual administrative state,
and healthy drives can be brought back online and active into the pool.

UNAVAIL:
The device (or VDEV) in question can not be opened. If a VDEV is UNAVAIL,
the pool will not be accessible or able to be imported. UNAVAIL devices may also report
as FAULTED in some scenarios. Operationally, UNAVAIL disks are roughly equivalent to FAULTED disks.

DEGRADED:
A fault in a device has occurred, impacting all VDEVs above it.
The pool is still operable, but redundancy may have been lost in a VDEV.

REMOVED:
The device was physically removed while the system was running.
Device removal detection is hardware-dependent and might not be supported on all platforms.

FAULTED:
All components (top and redundancy VDEVs, and drives) of the pool can be in a FAULTED state.
A FAULTED component is completely inaccessible. The severity of a device being DEGRADED
depends a lot on which device it is.

INUSE:
This is a status reserved for spares which have been used to replace a faulted drive.
* */

export enum TopologyItemStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Unavail = 'UNAVAIL',
  Degraded = 'DEGRADED',
  Removed = 'REMOVED',
  Faulted = 'FAULTED',
  Inuse = 'INUSE',
}
