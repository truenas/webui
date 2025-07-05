import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceWebshare = {
  storage_admins_tooltip: T('Allows your storage admins in the groups truenas_admin, truenas_readonly_administrators and truenas_sharing_administrators full access to the storage pools.'),
  search_enabled_tooltip: T('Enable TrueSearch file indexing and search functionality. When enabled, the active WebShares will be indexed for fast file searching.'),
  search_index_pool_tooltip: T('Pool to store the search index. A dataset will be created under <pool>/.webshare-private/search-index'),
  bulk_download_pool_tooltip: T('Pool for temporary storage of bulk downloads. A dataset will be created under <pool>/.webshare-private/bulk_download'),
  enable_web_terminal_tooltip: T('Enable web-based shell access through the WebShare Interface for users with a login shell enabled.'),
  allowed_groups_tooltip: T('Groups that are allowed to access the WebShare service. Users must be members of one of these groups to access WebShare.'),
  network_port_tooltip: T('Port for the WebShare service to listen on (1-65535).'),
  webshare_save_message: T('WebShare configuration saved successfully.'),
};
