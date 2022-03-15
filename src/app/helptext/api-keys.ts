import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  title: T('API Keys'),
  route_add_tooltip: T('Add API Key'),
  col_name: T('Name'),
  col_created_at: T('Created Date'),
  deleteMsg_title: T('API Key'),

  action_docs: T('DOCS'),
  action_edit: T('EDIT'),
  action_delete: T('DELETE'),

  name: {
    placeholder: T('Name'),
    tooltip: T('Descriptive identifier for this API key.'),
  },

  reset: {
    tooltip: T('Remove the existing API key and generate a new random key.\
 A dialog shows the new key and has an option to copy the key. Back up and\
 secure the API key! The key string is displayed only one time, at creation.'),
  },
};
