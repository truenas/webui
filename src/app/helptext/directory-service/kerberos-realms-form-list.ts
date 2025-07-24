import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextKerberosRealms = {
  realmTooltip: T('Enter the name of the realm.'),

  multipleValues: T('Separate multiple values by pressing <code>Enter</code>.'),
  kdcTooltip: T('Enter the name of the Key Distribution Center.'),
  adminServersTooltip: T('Define the server where all changes to the database are performed.'),
  passwordServersTooltip: T('Define the server where all password changes are performed.'),
  deleteDialogTitle: 'Kerberos Realm',
  primaryKdcTooltip: T('The master Kerberos domain controller for this realm. TrueNAS uses this as a fallback if it cannot get credentials because of an invalid password. This can help in environments where the domain uses a hub-and-spoke topology. Use this setting to reduce credential errors after TrueNAS automatically changes its machine password.'),
};
