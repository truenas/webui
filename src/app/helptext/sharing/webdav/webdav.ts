import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingWebdav = {
  placeholder_name: T('Name'),
  tooltip_name: T('Enter a name for the share.'),

  placeholder_comment: T('Description'),
  tooltip_comment: T('Optional.'),

  placeholder_path: T('Path'),
  tooltip_path: T('Browse to the pool or dataset to share.'),

  placeholder_ro: T('Read Only'),
  tooltip_ro: T('Set to prohibit users from writing to this share.'),

  placeholder_perm: T('Change User & Group Ownership'),
  tooltip_perm: T('Change existing ownership of ALL files in the share \
 to user <samp>webdav</samp> and group <samp>webdav</samp>. If unset, \
 ownership of files to be accessed through WebDAV must be manually set \
 to the <samp>webdav</samp> or <samp>www</samp> user/group.'),

  placeholder_enabled: T('Enabled'),
  tooltip_enabled: T('Enable this WebDAV share. Unset to disable this WebDAV \
 share without deleting it.'),

  column_name: T('Name'),
  column_comment: T('Description'),
  column_path: T('Path'),
  column_enabled: T('Enabled'),
  column_ro: T('Read Only'),
  column_perm: T('Ownership'),

  column_perm_tooltip: T('User and Group Ownership'),

  warning_dialog_title: T('WARNING'),
  warning_dialog_message: T('Ownership of all files in the share will \
 be changed to user <samp>webdav</samp> and group <samp>webdav</samp>. \
 Existing permissions will not be changed, but the ownership change \
 might make files inaccesible to their original owners. This operation \
 cannot be undone! If unset, ownership of files to be accessed through \
 WebDAV must be manually set to the <samp>webdav</samp> or \
 <samp>www</samp> user/group.'),
};
