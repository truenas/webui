import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  manager_needsDiskMessage: T('Add one or more disks to be used for data.'),

  manager_extendedNeedsDiskMessage: T('Add one or more disks to extend the pool.'),

  manager_sizeMessage: T('Estimated total raw data capacity'),

  manager_extendedSizeMessage: T('Estimated data capacity available after extension.'),

  manager_disknumErrorMessage: T('WARNING: Adding data vdevs with different numbers of\
 disks is not recommended.'),

  manager_disknumErrorConfirmMessage: T('It is not recommended to create a pool with vdevs\
 containing different numbers of disks. Continue?'),

  manager_disknumExtendConfirmMessage: T('It is not recommended to extend a pool with one or\
 more vdevs containing different numbers of disks. Continue?'),

  manager_vdevtypeErrorMessage: T('Adding data vdevs of different types is not supported.'),

  manager_stripeVdevTypeErrorMessage: T('vdev is highly discouraged and will result in data loss if it fails'),
  manager_logVdevWarningMessage: T('A stripe log vdev may result in data loss if it fails combined with a power outage.'),

  manager_diskAddWarning: T('The contents of all added disks will be erased.'),

  manager_diskExtendWarning: T('Added disks are erased, then the pool is extended onto\
 the new disks with the chosen topology. Existing data on the pool is kept intact.'),

  manager_name_tooltip: T('ZFS pools must conform to strict naming \
 <a href="https://docs.oracle.com/cd/E23824_01/html/821-1448/gbcpt.html" target="_blank">conventions</a>. \
 Choose a memorable name.'),

  manager_encryption_tooltip: T('Enable \
 <a href="https://zfsonlinux.org/manpages/0.8.3/man8/zfs.8.html" target="_blank">ZFS encryption</a> \
 for this pool and add an encryption algorithm selector.'),

  manager_suggested_layout_tooltip: T('Create a recommended formation\
 of vdevs in a pool.'),

  manager_encryption_message: T('Encryption is for users storing sensitive data.\
  Pool-level encryption does not apply to the storage pool or disks in the pool. It applies\
  to the root dataset that shares the pool name and any child datasets created unless you change\
  the encryption at the time you create the child dataset. For more information on encryption please\
  refer to the <a href="http://TrueNAS.com/docs/" target="_blank">TrueNAS Documentation hub</a>.'),

  manager_duplicate_title: T('Repeat Data VDev'),
  manager_duplicate_vdevs_tooltip: T('Create more data vdevs like the first.'),

  manager_duplicate_vdevs_placeholder: T('Additional Data VDevs to Create'),
  manager_duplicate_button: T('Repeat Vdev'),

  force_title: T('Warning'),
  force_warning: T('The current pool layout is not recommended.\
 Override the following errors?'),
  force_warnings: {
    diskSizeWarning: T('One or more data vdevs has disks of different sizes.'),
  },
  data_vdev_title: T('Data'),
  data_vdev_description: T('Normal vdev type, used for primary storage operations. ZFS pools always have at least one DATA vdev.'),
  cache_vdev_title: T('Cache'),
  cache_vdev_description: T('ZFS L2ARC read-cache that can be used with fast devices to accelerate read operations. Optional vdev that can be removed.'),
  log_vdev_title: T('Log'),
  log_vdev_description: T('ZFS LOG device that can improve speeds of synchronous writes. Optional write-cache that can be removed.'),
  spare_vdev_title: T('Hot Spare'),
  spare_vdev_description: T('Drive reserved for inserting into DATA pool vdevs when an active drive has failed.'),
  special_vdev_title: T('Metadata'),
  special_vdev_description: T('Special Allocation class, used to create Fusion pools. Optional vdev type\
 which is used to speed up metadata and small block IO.'),
  dedup_vdev_title: T('Dedup'),
  dedup_vdev_description: T('De-duplication tables are stored on this special vdev type. These vdevs must\
 be sized to <i>X</i> GiB for each <i>X</i> TiB of general storage.'),
  exported_pool_warning: T('This disk is part of the exported pool {pool}. Adding this disk to a new or other existing pools will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure you have backed up any sensitive data in {pool} before reusing/repurposing this disk.'),

};
