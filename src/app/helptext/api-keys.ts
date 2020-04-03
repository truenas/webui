import { T } from '../translate-marker';

export default {
    title: T('API Keys'),
    route_add_tooltip: T('Add API Key'),
    col_name: T('Name'),
    col_created_at: T('Created Date'),
    deleteMsg_title: T('APK Key'),

    action_add: T('ADD'),
    action_docs: T('DOCS'),
    action_edit: T('EDIT'),
    action_delete: T('DELETE'),

    formDialog: {
        add_title: T('Add API Key'),
        edit_title: T('Edit API Key'),
        add_button: T('ADD'),
        edit_button: T('SAVE'),
    },

    name: {
        placeholder: T('Name'),
        tooltip: T(''),
    },

    reset: {
        placeholder: T('reset'),
        tooltip: T(''),
    },

    apikeyCopyDialog: {
        title: T('API Key'),
        save_button: T('COPY TO CLICKBOARD'),
        close_button: T('CLOSE'),
        api_key_warning: T('<b>Success!</b> The API key has been created/reseted. <b>It will only appear here once.</b>'),
        api_key: T('API Key')
    }
}