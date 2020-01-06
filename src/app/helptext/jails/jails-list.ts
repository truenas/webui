import { T } from '../../translate-marker';

export default {
    globalConfig: {
        tooltip: T("Choose Pool for Plugin and Jail Manager"),
    },
    activatePoolDialog: {
        title:  T("Choose Pool for Plugin and Jail Storage"),
        selectedPool_placeholder: T('Choose a pool for plugin and jail storage.'),
        saveButtonText: T("Choose"),
        successInfoDialog: {
            title: T('Pool Chosen'),
            message: T("Using pool "),
        }
    },
    noPoolDialog: {
        title: T('No Pools'),
        message: T('Cannot create plugins or jails until a pool is present for storing them.'),
        buttonMsg: T('Create Pool'),
    }
}