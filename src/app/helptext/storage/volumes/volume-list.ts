import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextVolumes = {
  exportMessages: {
    stopServices: T('These services must be stopped to export the pool:'),
    restartServices: T('These services must be restarted to export the pool:'),
    continueMessage: T('Exporting/disconnecting will continue after services have been managed.'),
    continueAction: T('Manage Services and Continue'),
    unableToTerminate: T('Unable to terminate processes which are using this pool: '),
  },

  exportError: T('Error disconnecting/deleting pool.'),

  exportDialog: {
    warningSysDataset: T('This pool contains the system dataset that stores critical data like debugging \
core files, encryption keys for pools, and Samba 4 metadata such as the user/group cache and share level \
permissions. Exporting this pool will transfer the system dataset to another available pool. If the only \
available pool is encrypted, that pool will no longer be able to be locked. When no other pools exist, \
the system dataset transfers back to the TrueNAS operating system device.'),
    warning: T('WARNING: Disconnecting/deleting pool <i>{pool}</i>.\
 Data on the pool will not be available after export.\
 Data on the pool disks can be destroyed by setting the <b>Destroy data</b> option.\
 Back up critical data <b>before</b> disconnecting/deleting the pool.'),
    unknownState: T('The pool <i>{pool}</i>is in the database but not connected to the machine. If it was exported by \
    mistake, reconnect the hardware and use <b>Import Pool</b>.<br /><br />'),
    destroy: {
      label: T('Destroy data on this pool?'),
      tooltip: T('Destroy the ZFS filesystem for pool data. This is a permanent operation. You will be \
      unable to re-mount data from the exported pool.'),
    },
    cascade: {
      label: T('Delete saved configurations from TrueNAS?'),
      tooltip: T('Delete all TrueNAS configurations that depend on the exported pool. Impacted configurations\
       may include services (listed above if applicable), applications, shares, and scheduled data protection tasks.'),
    },
    enterName: T('Enter <strong>{pool}</strong> below to confirm'),
    confirm: T('Confirm Disconnect/Delete'),
    unknownStatusAltText: T('(Remove pool from database)'),
    saveButton: T('Disconnect/Delete'),
  },

  exporting: T('Exporting Pool'),

  upgradePoolDialogWarning: T('Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of TrueNAS: '),

  expandPoolDialog: {
    title: T('Expand pool '),
    message: T('Expand pool to fit all available disk space.'),
  },

  autotrimTooltip: T('Enable for TrueNAS to periodically review data blocks and identify\
 empty blocks, or obsolete blocks that can be deleted. Unset to use dirty block\
 overwrites (default).'),
  lockingDataset: T('Locking Dataset'),

  scrubTooltip: T('A scrub is a data integrity check of your pool. \
Scrubs identify data integrity problems, detect silent data corruptions caused by transient hardware issues, and provide early disk failure alerts.'),
};
