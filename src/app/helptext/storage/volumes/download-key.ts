import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextDownloadKey = {
// Add key form
  downloadkey_dialog_title: T('WARNING'),
  downloadkey_dialog_legacy_message: T('Back up the encryption key now! If the key is lost,\
 the data on the disks will also be lost with no hope of recovery. Click <b>Download\
 Encryption Key</b> to begin the download. This type of encryption is for users storing\
 sensitive data. iXsystems, Inc. cannot be held responsible for any lost or unrecoverable\
 data as a consequence of using this feature.'),
  downloadkey_dialog_zfs_message: T('Losing the ability to unlock the pool can result in losing all\
 data on the disks with no chance of recovery. Always back up the encryption key file or passphrase\
 for an encrypted pool! The key file for an encrypted pool is secured in the system database and\
 can be exported at any time from the pool options'),
  downloadkey_dialog_button: T('Download Encryption Key'),
  downloadkey_dialog_done: T('Done'),
};
