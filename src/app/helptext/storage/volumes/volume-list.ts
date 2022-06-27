import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  snapshotDialog_name_tooltip: T('Add a name for the new snapshot.'),
  snapshotDialog_recursive_tooltip: T('Set to include child datasets of the chosen dataset.'),

  exportAction: T('Export/Disconnect'),

  exportMessages: {
    services: T('These services depend on pool <i>{name}</i> and will be disrupted if the pool is detached:'),
    running: T('These running processes are using '),
    unknown: T('These unknown processes are using this pool: '),
    terminated: T('WARNING: These unknown processes will be terminated while exporting the pool. '),

    onfail: {
      stopServices: T('These services must be stopped to export the pool:'),
      restartServices: T('These services must be restarted to export the pool:'),
      continueMessage: T('Exporting/disconnecting will continue after services have been managed.'),
      continueAction: T('Manage Services and Continue'),
      unableToTerminate: T('Unable to terminate processes which are using this pool: '),
    },
  },

  exportError: T('Error exporting/disconnecting pool.'),

  exportDialog: {
    title: T("Export/disconnect pool: '"),
    warningSysDataset: T('This pool contains the system dataset that stores critical data like debugging \
core files, encryption keys for pools, and Samba 4 metadata such as the user/group cache and share level \
permissions. Exporting this pool will transfer the system dataset to another available pool. If the only \
available pool is encrypted, that pool will no longer be able to be locked. When no other pools exist, \
the system dataset transfers back to the TrueNAS operating system device.'),
    warningA: T('WARNING: Exporting/disconnecting pool <i>'),
    warningB: T('</i>.\
 Data on the pool will not be available after export.\
 Data on the pool disks can be destroyed by setting the <b>Destroy data</b> option.\
 Back up critical data <b>before</b> exporting/disconnecting the pool.'),
    warning: T('WARNING: Exporting/disconnecting pool <i>{pool}</i>.\
 Data on the pool will not be available after export.\
 Data on the pool disks can be destroyed by setting the <b>Destroy data</b> option.\
 Back up critical data <b>before</b> exporting/disconnecting the pool.'),
    unknownStateA: T('The pool <i>'),
    unknownStateB: T('</i>is in the database but not connected to the machine. If it was exported by \
    mistake, reconnect the hardware and use <b>Import Pool</b>.<br /><br />'),
    unknownState: T('The pool <i>{pool}</i>is in the database but not connected to the machine. If it was exported by \
    mistake, reconnect the hardware and use <b>Import Pool</b>.<br /><br />'),
    destroy: T('Destroy data on this pool?'),
    cascade: T('Delete configuration of shares that used this pool?'),
    enterName: T('Enter <strong>{pool}</strong> below to confirm'),
    confirm: T('Confirm Export/Disconnect'),
    unknown_status_alt_text: T('(Remove pool from database)'),
    saveButton: T('Export/Disconnect'),
  },

  exporting: T('Exporting Pool'),
  exportDisconnect: T('Export/Disconnect Pool'),

  upgradePoolDialog_warning: T('Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of TrueNAS: '),

  acl_edit_msg: T('Root dataset ACL cannot be edited.'),

  expand_pool_dialog: {
    title: T('Expand pool '),
    message: T('Expand pool to fit all available disk space.'),
    passphrase_placeholder: T('Passphrase'),
    save_button: T('Expand Pool'),
  },
  expand_pool_success_dialog: {
    title: T('Pool Expanded'),
  },

  pool_actions_title: T('Pool Actions'),
  encryption_actions_title: T('Encryption Actions'),

  dataset_actions: T('Dataset Actions'),
  zvol_actions: T('Zvol Actions'),
  encryption_options: T('Encryption Options'),
  encryption_options_dialog: {
    inherit_placeholder: T('Inherit encryption properties from parent'),
    save_encryption_options: T('Save Encryption Options'),
    saving_encryption_options: T('Saving Encryption Options...'),
    save_button: T('Save'),
  },
  pool_options_dialog: {
    autotrim_placeholder: T('Auto TRIM'),
    autotrim_tooltip: T('Enable for TrueNAS to periodically review data blocks and identify\
 empty blocks of obsolete blocks that can be deleted. Unset to incorporate day block\
 overwrites when a device write is started (default).'),
    confirm_checkbox: T('Confirm'),
    save_button: T('Save'),
    dialog_saved_title: T('Pool Options Saved'),
    save_pool_options: T('Save Pool Options'),
    saving_pool_options: T('Saving Pool Options...'),
  },
  lock_dataset_dialog: {
    button: T('Lock'),
    locking_dataset: T('Locking Dataset'),
  },
};
