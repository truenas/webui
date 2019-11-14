import { Validators } from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
// storage/VMware-snapshot/VMware-snapshot-form
VMware_snapshot_form_hostname_placeholder: T('Hostname'),
VMware_snapshot_form_hostname_tooltip: T('Enter the IP address or hostname of the VMware host.\
 When clustering, this is the vCenter server for the cluster.'),
VMware_snapshot_form_hostname_validation: [Validators.required],

VMware_snapshot_form_username_placeholder: T('Username'),
VMware_snapshot_form_username_tooltip: T('Enter the user on the VMware host with permission to\
 snapshot virtual machines.'),
VMware_snapshot_form_username_validation: [Validators.required],

VMware_snapshot_form_password_placeholder: T('Password'),
VMware_snapshot_form_password_tooltip: T('Enter the password associated with <b>Username</b>.'),
VMware_snapshot_form_password_validation: [Validators.required],

VMware_snapshot_form_filesystem_placeholder: T('ZFS Filesystem'),
VMware_snapshot_form_filesystem_tooltip: T('Enter the filesystem to snapshot.'),
VMware_snapshot_form_filesystem_validation: [Validators.required],

VMware_snapshot_form_datastore_placeholder: T('Datastore'),
VMware_snapshot_form_datastore_tooltip: T('After entering the <b>Hostname, Username</b>, and\
 <b>Password</b>, click <b>Fetch Datastores</b> and\
 select the datastore to be synchronized.'),
VMware_snapshot_form_datastore_validation: [Validators.required],

connect_err_dialog: {
 title: T('Connection Error'),
 msg: T('The operation timed out. The requested resource might be offline. Check the network connection.')
}

}