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
bucket_input_tooltip: T('Enter the pre-defined S3 bucket to use.'),
bucket_input_validation : [ Validators.required ],

folder_placeholder: T('Folder'),
folder_tooltip: T('Enter the name of the destination folder.'),

encryption_placeholder: T('Server Side Encryption'),
encryption_tooltip: T('Choose <i>AES-256</i> or <i>None</i>.'),

storage_class_placeholder: T('Storage Class'),
storage_class_tooltip: T('Classification for each S3 object. Choose a\
 class based on the specific use case or performance requirements.\
 See <a\
 href="https://docs.aws.amazon.com/AmazonS3/latest/dev/storage-class-intro.html"\
 target="_blank">Amazon S3 Storage Classes</a> for more information.'),

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

transfer_mode_validation : [ Validators.required ],

transfer_mode_warning_sync: T('<b>SYNC</b>: Files on the destination are <i><u>changed</u></i> to match those on the\
 source. If a file does not exist on the source, it is also <i><u>deleted</u></i>\
 from the destination.'),

transfer_mode_warning_copy: T('<b>COPY</b>: Files from the source are <i><u>copied</u></i> to the destination. If files with\
 the same names are present on the destination, they are <i><u>overwritten</u></i>.'),

transfer_mode_warning_move: T('<b>MOVE</b>: After files are <i><u>copied</u></i> from the source to the destination, they are\
 <i><u>deleted</u></i> from the source. Files with the same names on the destination are <i><u>overwritten</u></i>.'),

snapshot_placeholder: T('Take Snapshot'),
snapshot_tooltip: T('Set to take a snapshot of the dataset before a <i>PUSH</i>.'),


pre_script_placeholder: T('Pre-script'),
pre_script_tooltip: T('Script to execute before running sync.'),

post_script_placeholder: T('Post-script'),
post_script_tooltip: T('Script to execute after running sync.'),

remote_encryption_placeholder: T('Remote Encryption'),
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

filename_encryption_placeholder: T('Filename Encryption'),
filename_encryption_tooltip: T('Encrypt (<i>PUSH</i>) or decrypt \
 (<i>PULL</i>) file names with the rclone \
 <a href="https://rclone.org/crypt/#file-name-encryption-modes" target="_blank">"Standard" file name encryption mode</a>. \
 The original directory structure is preserved. Identical file names \
 remain identical after encryption.<br><br> \
 <i>PULL</i> tasks that have <b>Filename Encryption</b> enabled and an \
 incorrect <b>Encryption Password</b> or <b>Encryption Salt</b> will not \
 transfer any files but still report that the task was successful. To \
 verify that files were transferred successfully, click the finished \
 task status to see a list of transferred files.'),

encryption_password_placeholder: T('Encryption Password'),
encryption_password_tooltip: T('Password to encrypt and decrypt remote \
 data. <b>Warning:</b> Always securely back up this password! Losing the \
 encryption password can result in data loss.'),

encryption_salt_placeholder: T('Encryption Salt'),
encryption_salt_tooltip: T('Enter a long string of random characters for \
 use as <a href="https://searchsecurity.techtarget.com/definition/salt" \
 target="_blank">salt</a> for the encryption password. <b>Warning:</b> \
 Always securely back up the encryption salt value! Losing the salt \
 value can result in data loss.'),

args_placeholder: T('Auxiliary Arguments'),
args_tooltip: T('These arguments are passed to <a href="https://rclone.org/docs/" target="_blank">rclone</a>.'),

cloudsync_picker_placeholder: T('Schedule the Cloud Sync Task'),
cloudsync_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i> to open\
 the advanced scheduler.'),

follow_symlinks_placeholder: T('Follow Symlinks'),
follow_symlinks_tooltip: T('Follow symlinks and copy the items to which they link.'),

transfers_placeholder: T('Transfers'),
transfers_tooltip: T('Number of simultaneous file transfers. Enter a\
 number based on the available bandwidth and destination system\
 performance. See <a href="https://rclone.org/docs/#transfers-n"\
 target="_blank">rclone --transfers</a>.'),

enabled_placeholder: T('Enabled'),
enabled_tooltip: T('Enable this Cloud Sync Task. Unset to disable this Cloud\
 Sync Task without deleting it.'),

bwlimit_placeholder: T('Bandwidth Limit'),
bwlimit_tooltip: T('A single bandwidth limit or bandwidth limit schedule in rclone format.\
 Example: <samp>08:00,512 12:00,10MB 13:00,512 18:00,30MB 23:00,off</samp>.\
 Units can be specified with the beginning letter: <samp>b</samp>,\
 <samp>k</samp> (default), <samp>M</samp>, or <samp>G</samp>.\
 See <a href="https://rclone.org/docs/#bwlimit-bandwidth-spec"\
 target="_blank">rclone --bwlimit</a>.'),

exclude_placeholder: T('Exclude'),
exclude_tooltip: T('Newline-separated list of files and directories to exclude from sync.<br />\
 See https://rclone.org/filtering/ for more details on --exclude option.'),

resetTransferModeDialog: {
    title: T('Transfer Mode Reset'),
    content: T('Transfer Mode has been reset to <i>COPY</i>.'),
}
}
