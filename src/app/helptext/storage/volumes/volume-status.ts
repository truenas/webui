import { T } from '../../../translate-marker';

export default {
    dialogFormFields: {
        disk: {
            placeholder: T('Member disk'),
            tooltip: T('Choose a new disk for the pool. To protect any existing data,\
 adding the selected disk is stopped when the disk is already in use or has partitions present.'),
        },
        passphrase: {
            placeholder: T('Passphrase'),
            tooltip: T('Enter the current passphrase for the encrypted pool. This will be used\
 to encrypt the new disk and integrate it into the pool.')
        },
        passphrase2: {
            placeholder: T('Confirm Passphrase'),
            tooltip: T('Verify the pool encryption passphrase.'),
        },
        force: {
            placeholder: T('Force'),
            tooltip: T('Set to override safety checks and add the disk to the pool. <br>WARNING:\
 any data stored on the disk will be erased!'),
        },
        new_disk: {
            placeholder: T('New Disk'),
            tooltip: T('Select an unused disk to add to this vdev. <br>WARNING: any data stored\
 on the unused disk will be erased!'),
        }
    },

    actions_label: {
        edit: T('Edit'),
        offline: T("Offline"),
        online: T("Online"),
        replace: T("Replace"),
        remove: T("Remove"),
        detach: T("Detach"),
        extend: T("Extend"),
    },
    
    offline_disk: {
        title: T('Offline Disk'),
        message: T('Offline disk '),
        encryptPoolWarning: T('<br><b>Warning: Disks cannot be onlined in encrypted pools.</b></br>'),
        buttonMsg: T('Offline'),
    },

    online_disk: {
        title: T('Online Disk'),
        message: T('Online disk '),
        buttonMsg: T('Online'),
    },
    replace_disk: {
        form_title: T("Replacing disk "),
        saveButtonText: T("Replace Disk"),
        title: T("Replacing Disk"),
        description: T("Replacing disk..."),
        info_dialog_content: T("Successfully replaced disk "),
    },
    remove_disk: {
        title: T('Remove Disk'),
        message: T('Remove disk '),
        buttonMsg: T('Remove'),
    },
    detach_disk: {
        title: T('Detach Disk'),
        message: T('Detach disk '),
        buttonMsg: T('Detach'),
    },
    extend_disk: {
        form_title: T('Extend Vdev'),
        saveButtonText: T('Extend'),
        title: T("Extending Vdev"),
        description: T("Extending vdev..."),
        info_dialog_content: T("Successfully extended vdev "),
    }
}
