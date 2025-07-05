import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingWebshare = {
  description: T('Provides web-based file access to authorized users. Create WebShares to specific directories.'),

  webshare_form_title_add: T('Add WebShare'),
  webshare_form_title_edit: T('Edit WebShare'),

  webshare_name_label: T('Name'),
  webshare_name_tooltip: T('A unique name for this WebShare. Must contain only letters, numbers, hyphens, and underscores.'),
  webshare_name_placeholder: T('e.g., documents, media, shared'),

  webshare_path_label: T('Path'),
  webshare_path_tooltip: T('The directory path to share. Must be under /mnt/<poolname>/. All subdirectories will be accessible.'),

  webshare_warning: T('WebShares are recursive - all subdirectories within the selected path will be accessible to authorized users based on their filesystem permissions.'),

  webshare_search_indexed_label: T('TrueSearch Indexing'),
  webshare_search_indexed_tooltip: T('Enable indexing of this WebShare content for search functionality. When enabled, files in this WebShare will be searchable through TrueSearch.'),

  validation_errors: {
    name_required: T('Name is required'),
    name_pattern: T('Name must contain only letters, numbers, hyphens, and underscores'),
    name_exists: T('A WebShare with this name already exists'),
    path_required: T('Path is required'),
    path_invalid: T('Path must be under /mnt/<poolname>/'),
    path_root_dataset: T('Sharing root datasets is not recommended. Please select a subdirectory.'),
    path_nested: T('This path is already covered by the WebShare "{name}" at {path}'),
    path_contains_existing: T('This path would include the existing WebShare "{name}" at {path}'),
  },

  delete_dialog_title: T('Delete WebShare'),
  delete_dialog_message: T('Are you sure you want to delete the WebShare "{name}"? Users will no longer be able to access {path} through WebShare.'),

  service_disabled_message: T('The WebShare service must be configured and started before adding WebShares.'),
};
