import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    description_placeholder: T('Description'),
    description_tooltip: T('Enter a description of the Cloud Sync Task.'),
    description_validation : [ Validators.required ],

    direction_placeholder: T('Direction'),
    direction_tooltip: T('<i>Push</i> sends data to cloud storage. <i>Pull</i>\
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
    remote_encryption_tooltip: T('Set to encrypt files before transfer and store the\
                encrypted files on the remote system.\
                <a href="https://rclone.org/crypt/"\
                target="_blank">rclone Crypt</a> is used.'),

    filename_encryption_placeholder: T('Filename encryption'),
    filename_encryption_tooltip: T('Set to encrypt the shared file names.'),

    encryption_password_placeholder: T('Encryption password'),
    encryption_password_tooltip: T('Enter the password to encrypt and decrypt remote data.\
                <b>Warning</b>: Always save and back up this password.\
                Losing the encryption password can result in data loss.'),

    encryption_salt_placeholder: T('Encryption salt'),
    encryption_salt_tooltip: T('Enter a long string of random characters for use as\
                <a href="https://searchsecurity.techtarget.com/definition/salt"\
                target="_blank">salt</a> for the encryption password.\
                <b>Warning:</b> Save and back up the encryption salt\
                value. Losing the salt value can result in data loss.'),

    args_placeholder: T('Auxiliary arguments'),

    cloudsync_picker_placeholder: T('Schedule the Cloud Sync Task'),
    cloudsync_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i> to open\
                the advanced scheduler.'),

    transfers_placeholder: T('Transfers'),
    transfers_tooltip: T(' The number of file transfers to run in parallel. It can \
sometimes be useful to set this to a smaller number if the remote is giving a lot of \
timeouts or bigger if you have lots of bandwidth and a fast remote.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Enable this Cloud Sync Task. Unset to disable this Cloud\
                Sync Task without deleting it.'),
}