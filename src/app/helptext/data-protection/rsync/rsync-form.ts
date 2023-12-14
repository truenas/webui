import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextRsyncForm = {
  rsync_path_tooltip: T('Browse to the path to be copied. Linux\
 file path limits apply. Other operating systems can have different\
 limits which might affect how they can be used as sources or\
 destinations.'),
  rsync_user_tooltip: T('Select the user to run the rsync task. The user\
                selected must have permissions to write to the\
                specified directory on the remote host.'),
  rsync_remotehost_tooltip: T('Enter the IP address or hostname of the remote\
 system that will store the copy. Use the format\
 <i>username@remote_host</i> if the username differs\
 on the remote host.'),
  ssh_keyscan_tooltip: T('Scan remote host key.'),
  rsync_remoteport_tooltip: T('Enter the SSH Port of the remote system.'),
  rsync_mode_tooltip: T('Choose to either use a custom-defined remote module \
 of the rsync server or to use an SSH configuration for the rsync task.'),
  rsync_remotemodule_tooltip: T('At least one module must be defined in <a\
                href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
                target="_blank">rsyncd.conf(5)</a> of the rsync\
                server or in the <b>Rsync Modules</b> of another\
                system.'),
  rsync_remotepath_tooltip: T('Browse to the existing path on the remote host to\
                sync with. Maximum path length is 255 characters'),
  rsync_validate_rpath_tooltip: T('Set to automatically create the defined <b>Remote\
                Path</b> if it does not exist.'),
  rsync_direction_tooltip: T('Direct the flow of data to the remote host.'),
  rsync_description_tooltip: T('Enter a description of the rsync task.'),
  rsync_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i>\
                to open the advanced scheduler.'),
  rsync_recursive_tooltip: T('Set to include all subdirectories of the specified\
                directory. When unset, only the specified directory\
                is included.'),
  rsync_times_tooltip: T('Set to preserve modification times of files.'),
  rsync_compress_tooltip: T('Set to reduce the size of data to transmit.\
                Recommended for slow connections.'),
  rsync_archive_tooltip: T('When set, rsync is run recursively, preserving\
                symlinks, permissions, modification times, group,\
                and special files. When run as root, owner, device\
                files, and special files are also preserved.\
                Equivalent to passing the flags <i>-rlptgoD</i> to\
                rsync.'),
  rsync_delete_tooltip: T('Delete files in the destination directory\
                that do not exist in the source directory.'),
  rsync_quiet_tooltip: T('Set to suppress informational messages from the\
                remote server.'),
  rsync_preserveperm_tooltip: T('Set to preserve original file permissions. This is\
                useful when the user is set to <i>root</i>.'),
  rsync_preserveattr_tooltip: T('<a href="https://en.wikipedia.org/wiki/Extended_file_attributes"\
                target="_blank">Extended attributes</a> are\
                preserved, but must be supported by both systems.'),
  rsync_delayupdates_tooltip: T('Set to save the temporary file from each updated\
                file to a holding directory until the end of the\
                transfer when all transferred files are renamed\
                into place.'),
  rsync_extra_tooltip: T('Additional \
     <a href="https://rsync.samba.org/ftp/rsync/rsync.html" target="_blank">rsync(1)</a> \
     options to include. Separate entries by pressing <code>Enter</code>.<br> \
     Note: The "*" character must be escaped with a backslash (\\*.txt) or used \
     inside single quotes (\'*.txt\').'),
  rsync_enabled_tooltip: T('Enable this rsync task. Unset to disable this\
                rsync task without deleting it.'),
  rsync_ssh_connect_mode_tooltip: T('Choose to connect using either SSH private key stored \
  in user\'s home directory or SSH connection from the keychain'),
  rsync_ssh_credentials_tooltip: T('Select an existing SSH connection to a remote system or \
  choose Create New to create a new SSH connection.'),
};
