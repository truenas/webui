import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export * from './iscsi/iscsi';
export * from './nfs/nfs';
export * from './smb/smb';

export const shared = {
  delete_share_message: T('The sharing configuration will be removed.\
    Data in the share dataset will not be affected.'),

  dialog_title: T('Enable service'),
  dialog_message: T('Enable this service to start automatically.'),
  dialog_button: T('Enable Service'),
};
