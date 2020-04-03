import { T } from '../translate-marker';

export default {
    title: T('API Keys'),
    route_add_tooltip: T('Add API Key'),
    col_name: T('Name'),
    col_created_at: T('Created Date'),
    deleteMsg_title: T('API Key'),

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
        tooltip: T('Descriptive identifier for this API key.'),
    },

    reset: {
        placeholder: T('reset'),
        tooltip: T('Remove the existing API key and generate a new random key.\
 A dialog shows the new key and has an option to copy the key. Back up and\
 secure the API key! The key string is displayed only one time, at creation.'),
    },

    apikeyCopyDialog: {
        title: T('API Key'),
        save_button: T('COPY TO CLIPBOARD'),
        close_button: T('CLOSE'),
        api_key_warning: T('<b>Success!</b> The API key has been created or reset. <b>This is the only time the key is shown.</b>'),
        api_key: T('API Key')
    }
}