import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    description_placeholder: T('Description'),
    description_tooltip: T('Enter a description of the Cloud Sync Task.'),
    description_validation : [ Validators.required ],

    direction_placeholder: T('Direction'),
    direction_tooltip: T('<i>PUSH</i> sends data to cloud storage. <i>PULL</i> \
 receives data from cloud storage.'),
    direction_validation : [ Validators.required ],


    credentials_placeholder: T('Credential'),
    credentials_tooltip: T('Select the cloud storage provider credentials from the\
                list of available Cloud Credentials.'),
    credentials_validation : [ Validators.required ],

    bucket_placeholder: T('Bucket'),
    bucket_tooltip: T('Select the pre-defined S3 bucket to use.'),
    bucket_validation : [ Validators.required ],

    bucket_input_placeholder: T('Bucket'),
    bucket_input_tooltip: T('Input the pre-defined S3 bucket to use.'),
    bucket_input_validation : [ Validators.required ],

    folder_placeholder: T('Folder'),
    folder_tooltip: T('Enter the name of the destination folder.'),

    encryption_placeholder: T('Server Side Encryption'),
    encryption_tooltip: T('Choose <i>AES-256</i> or <i>None</i>.'),

    path_placeholder: T('Directory/Files'),
    path_tooltip: T('Select the directories or files to be sent to the cloud\
                for Push syncs, or the destination to be written for\
                Pull syncs. Be cautious about the destination of Pull\
                jobs to avoid overwriting existing files.'),
    path_validation : [ Validators.required ],

    transfer_mode_placeholder: T('Transfer Mode'),
    transfer_mode_tooltip: T('<i>SYNC</i> makes files on the destination system identical\
                to those on the source. Files that have been removed from\
                the source are removed from the destination, similar to\
                <i>rsync --delete</i>.\
                <i>COPY</i> copies files from source to destination,\
                skipping files that are identical, similar to <i>rsync</i>.\
                <i>MOVE</i> copies files from source to destination,\
                deleting files from the source after the copy, similar\
                to <i>mv</i>.'),

    transfer_mode_validation : [ Validators.required ],

    remote_encryption_placeholder: T('Remote encryption'),
    remote_encryption_tooltip: T('Use \
 <a href="https://rclone.org/crypt/" target="_blank">rclone crypt</a> \
 to manage data encryption during <i>PUSH</i> or <i>PULL</i> transfers:<br><br> \
 <i>PUSH:</i> Encrypt files before transfer and store the encrypted \
 files on the remote system. Files are encrypted using the \
 <b>Encryption Password</b> and <b>Encryption Salt</b> values.<br><br> \
 <i>PULL:</i> Decrypt files that are being stored on the remote system \
 before the transfer. Transferring the encrypted files requires entering \
 the same <b>Encryption Password</b> and <b>Encryption Salt</b> that was \
 used to encrypt the files.<br><br> \
 Additional details about the encryption algorithm and key derivation \
 are available in the \
 <a href="https://rclone.org/crypt/#file-formats" target="_blank">rclone crypt File formats documentation</a>.'),

    filename_encryption_placeholder: T('Filename encryption'),
    filename_encryption_tooltip: T('Encrypt (<i>PUSH</i>) or decrypt \
 (<i>PULL</i>) file names with the rclone \
 <a href="https://rclone.org/crypt/#file-name-encryption-modes" target="_blank">"Standard" file name encryption mode</a>. \
 The original directory structure is preserved. A filename with the same \
 name always has the same encrypted filename.<br><br> \
 <i>PULL</i> tasks that have <b>Filename Encryption</b> enabled and an \
 incorrect <b>Encryption Password</b> or <b>Encryption Salt</b> will not \
 transfer any files but still report that the task was successful. To \
 verify that files were transferred successfully, click the finished \
 task status to see a list of transferred files.'),

    encryption_password_placeholder: T('Encryption password'),
    encryption_password_tooltip: T('Password to encrypt and decrypt remote \
 data. <b>Warning:</b> Always securely back up this password! Losing the \
 encryption password will result in data loss.'),

    encryption_salt_placeholder: T('Encryption salt'),
    encryption_salt_tooltip: T('Enter a long string of random characters for \
 use as <a href="https://searchsecurity.techtarget.com/definition/salt" \
 target="_blank">salt</a> for the encryption password. <b>Warning:</b> \
 Always securely back up the encryption salt value! Losing the salt \
 value will result in data loss.'),

    args_placeholder: T('Auxiliary arguments'),

    cloudsync_picker_placeholder: T('Schedule the Cloud Sync Task'),
    cloudsync_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i> to open\
                the advanced scheduler.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Enable this Cloud Sync Task. Unset to disable this Cloud\
                Sync Task without deleting it.'),
}
