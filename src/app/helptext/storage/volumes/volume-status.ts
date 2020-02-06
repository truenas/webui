import { T } from '../../../translate-marker';

export default {
    dialogFormFields: {
        disk: {
            placeholder: T('Member disk'),
            tooltip: T(''),
        },
        passphrase: {
            placeholder: T('Passphrase'),
            tooltip: T('')
        },
        passphrase2: {
            placeholder: T('Confirm Passphrase'),
            tooltip: T(''),
        },
        force: {
            placeholder: T('Force'),
            tooltip: T(''),
        },
        new_disk: {
            placeholder: T('New Disk'),
            tooltip: T(''),
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
