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
bucket_input_tooltip: T('Enter the pre-defined S3 bucket to use.'),
bucket_input_validation : [ Validators.required ],

folder_placeholder: T('Folder'),
folder_tooltip: T('Enter the name of the destination folder.'),

encryption_placeholder: T('Server Side Encryption'),
encryption_tooltip: T('Choose <i>AES-256</i> or <i>None</i>.'),

storage_class_placeholder: T('Storage Class'),
storage_class_tooltip: T('See <a\
 href="https://docs.aws.amazon.com/AmazonS3/latest/dev/storage-class-intro.html"\
 target="_blank">Amazon S3 Storage Classes</a> for more information on\
 which storage class to choose.'),

b2_chunk_size_placeholder:  T('Upload Chunk Size (MiB)'),
b2_chunk_size_tooltip: T('Files are split into chunks of this size before upload.\
 Up to «--transfers» chunks can be in progress at one time. The single largest file\
 being transferred must fit into no more than 10,000 chunks.'),

fast_list_placeholder: T('Use --fast-list'),
fast_list_tooltip: T('[Use fewer transactions in exchange for more RAM.](https://rclone.org/docs/#fast-list)\
 This can also speed up or slow down the transfer.'),

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

snapshot_placeholder: T('Take Snapshot'),
snapshot_tooltip: T('Create a snapshot of the dataset before pushing data.'),

pre_script_placeholder: T('Pre-script'),
pre_script_tooltip: T('Script to execute before running sync.'),

post_script_placeholder: T('Post-script'),
post_script_tooltip: T('Script to execute after running sync.'),

remote_encryption_placeholder: T('Remote Encryption'),
remote_encryption_tooltip: T('Set to encrypt files before transfer and store the\
 encrypted files on the remote system.\
 <a href="https://rclone.org/crypt/"\
 target="_blank">rclone Crypt</a> is used.'),

filename_encryption_placeholder: T('Filename Encryption'),
filename_encryption_tooltip: T('Set to encrypt the shared file names.'),

encryption_password_placeholder: T('Encryption Password'),
encryption_password_tooltip: T('Enter the password to encrypt and decrypt remote data.\
 <b>Warning</b>: Always save and back up this password.\
 Losing the encryption password can result in data loss.'),

encryption_salt_placeholder: T('Encryption Salt'),
encryption_salt_tooltip: T('Enter a long string of random characters for use as\
 <a href="https://searchsecurity.techtarget.com/definition/salt"\
 target="_blank">salt</a> for the encryption password.\
 <b>Warning:</b> Save and back up the encryption salt\
 value. Losing the salt value can result in data loss.'),

args_placeholder: T('Auxiliary Arguments'),
args_tooltip: T('These arguments are passed to <a href="https://rclone.org/docs/" target="_blank">rclone</a>.'),

cloudsync_picker_placeholder: T('Schedule the Cloud Sync Task'),
cloudsync_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i> to open\
 the advanced scheduler.'),

follow_symlinks_placeholder: T('Follow Symlinks'),
follow_symlinks_tooltip: T('Follow symlinks and copy the items to which they link.'),

transfers_placeholder: T('Transfers'),
transfers_tooltip: T(' The number of file transfers to run in parallel. It can\
 sometimes be useful to set this to a smaller number if the remote is giving a lot of\
 timeouts, or a larger number if there is high bandwidth and a fast remote.'),

enabled_placeholder: T('Enabled'),
enabled_tooltip: T('Enable this Cloud Sync Task. Unset to disable this Cloud\
 Sync Task without deleting it.'),

bwlimit_placeholder: T('Bandwidth Limit'),
bwlimit_tooltip: T('Either single bandwidth limit or bandwidth limit schedule in rclone format.<br />\
 Example: "08:00,512 12:00,10MB 13:00,512 18:00,30MB 23:00,off".<br />\
 Default unit is kilobytes.'),

exclude_placeholder: T('Exclude'),
exclude_tooltip: T('Newline-separated list of files and directories to exclude from sync.<br />\
 See https://rclone.org/filtering/ for more details on --exclude option.'),

}
