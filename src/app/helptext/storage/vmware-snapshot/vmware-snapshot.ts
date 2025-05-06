import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextVmwareSnapshot = {
  hostnameLabel: T('Hostname'),
  hostnameTooltip: T('Enter the IP address or hostname of the VMware host.\
 When clustering, this is the vCenter server for the cluster.'),

  usernameLabel: T('Username'),
  usernameTooltip: T('Enter the user on the VMware host with permission to\
 snapshot virtual machines.'),

  passwordLabel: T('Password'),
  passwordTooltip: T('Enter the password associated with <b>Username</b>.'),

  filesystemLabel: T('ZFS Filesystem'),
  filesystemTooltip: T('Enter the filesystem to snapshot.'),

  datastoreLabel: T('Datastore'),
  datastoreTooltip: T('After entering the <b>Hostname, Username</b>, and\
 <b>Password</b>, click <b>Fetch Datastores</b> and\
 select the datastore to be synchronized.'),

  connectionErrorDialog: {
    title: T('Connection Error'),
    message: T('The operation timed out. The requested resource might be offline. Check the network connection.'),
  },

};
